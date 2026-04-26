const { google } = require('googleapis');
const moment = require('moment');

class InterviewSchedulerSkill {
  static name = 'interview-scheduler';
  static description = 'Lên lịch phỏng vấn tự động với Google Calendar';

  async execute(context) {
    const { candidates = [], interviewers = [], job = {}, accessToken = null } = context;

    const schedules = await this.findAvailableSlots(interviewers, accessToken);
    const matched = this.matchCandidates(candidates, job);
    const scheduled = await this.scheduleInterviews(matched, schedules, accessToken);
    const calendarLinks = this.generateCalendarLinks(scheduled);
    
    return {
      scheduled: scheduled.interviews,
      availableSlots: schedules,
      conflicts: scheduled.conflicts,
      calendarLinks,
      reminders: this.setupReminders(scheduled),
      analytics: this.getAnalytics(scheduled)
    };
  }

  async findAvailableSlots(interviewers, accessToken) {
    let slots = [];
    
    if (accessToken) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: accessToken });
        const now = moment();
        
        for (const interviewer of interviewers) {
          const freebusy = await calendar.freebusy.query({
            resource: {
              timeMin: now.format(),
              timeMax: now.add(7, 'days').format(),
              items: [{ id: interviewer.email }]
            }
          });
          
          const available = this.calculateFreeSlots(freebusy.data.calendars[interviewer.email]);
          slots.push({ interviewer: interviewer.name, email: interviewer.email, slots: available });
        }
      } catch (error) {
        console.error('Calendar Error:', error.message);
      }
    }

    if (slots.length === 0) {
      slots = this.getDefaultSlots(interviewers);
    }

    return slots;
  }

  calculateFreeSlots(busyData) {
    const slots = [];
    const workStart = 9;
    const workEnd = 17;

    for (let day = 0; day < 5; day++) {
      const date = moment().add(day, 'days');
      for (let hour = workStart; hour < workEnd; hour++) {
        const slotStart = date.clone().hour(hour).minute(0);
        const isBusy = busyData?.busy?.some(b => 
          moment(b.start).isBefore(slotStart) && moment(b.end).isAfter(slotStart)
        );
        
        if (!isBusy) {
          slots.push({
            date: date.format('YYYY-MM-DD'),
            time: `${hour}:00`,
            datetime: slotStart.format()
          });
        }
      }
    }

    return slots;
  }

  getDefaultSlots(interviewers) {
    const slots = [];
    const workHours = [9, 10, 11, 14, 15, 16];

    for (const interviewer of interviewers) {
      const interviewerSlots = [];
      for (let day = 1; day <= 5; day++) {
        for (const hour of workHours) {
          interviewerSlots.push({
            date: moment().add(day, 'days').format('YYYY-MM-DD'),
            time: `${hour}:00`,
            datetime: moment().add(day, 'days').hour(hour).minute(0).format()
          });
        }
      }
      slots.push({ interviewer: interviewer.name, email: interviewer.email, slots: interviewerSlots });
    }

    return slots;
  }

  matchCandidates(candidates, job) {
    return candidates
      .filter(c => c.score >= (job.minScore || 60))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(c => ({
        ...c,
        rounds: job.interviewRounds || 2,
        type: job.type || 'online'
      }));
  }

  async scheduleInterviews(matched, schedules, accessToken) {
    const interviews = [];
    const conflicts = [];
    let currentSlot = 0;

    for (const candidate of matched) {
      const candidateInterviews = [];
      
      for (let round = 1; round <= candidate.rounds; round++) {
        const scheduler = schedules.find(s => s.interviewer === candidate.interviewers?.[round - 1]) || schedules[0];
        
        if (scheduler && currentSlot < scheduler.slots.length) {
          const slot = scheduler.slots[currentSlot];
          const interview = {
            id: this.generateInterviewId(),
            candidate: candidate.name,
            candidateEmail: candidate.email,
            round,
            interviewer: scheduler.interviewer,
            interviewerEmail: scheduler.email,
            datetime: slot.datetime,
            duration: round === candidate.rounds ? 60 : 45,
            type: candidate.type,
            status: 'scheduled'
          };

          candidateInterviews.push(interview);

          if (accessToken) {
            await this.createCalendarEvent(accessToken, interview);
          }
        } else {
          conflicts.push({ candidate: candidate.name, round, reason: 'No available slots' });
        }
      }

      if (candidateInterviews.length > 0) {
        interviews.push(...candidateInterviews);
      }
      currentSlot++;
    }

    return { interviews, conflicts };
  }

  async createCalendarEvent(accessToken, interview) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: accessToken });
      
      await calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary: `Phỏng vấn: ${interview.candidate} - Vòng ${interview.round}`,
          description: `Interview Round ${interview.round}\nCandidate: ${interview.candidate}\nType: ${interview.type}`,
          start: { dateTime: interview.datetime, timeZone: 'Asia/Ho_Chi_Minh' },
          end: { dateTime: moment(interview.datetime).add(interview.duration, 'minutes').format(), timeZone: 'Asia/Ho_Chi_Minh' },
          attendees: [{ email: interview.candidateEmail }, { email: interview.interviewerEmail }],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 60 },
              { method: 'popup', minutes: 15 }
            ]
          }
        }
      });
    } catch (error) {
      console.error('Calendar Event Error:', error.message);
    }
  }

  generateInterviewId() {
    return 'INT-' + Date.now();
  }

  generateCalendarLinks(interviews) {
    return {
      gcalAdd: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Interview`,
      outlook: 'https://outlook.office.com/calendar/0/deeplink/ compose',
      ics: this.generateICS(interviews)
    };
  }

  generateICS(interviews) {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//EcoSynTech//Interview//EN\n';
    
    interviews.forEach(interview => {
      ics += 'BEGIN:VEVENT\n';
      ics += `DTSTART:${moment(interview.datetime).format('YYYYMMDDTHHmmss')}\n`;
      ics += `DTEND:${moment(interview.datetime).add(interview.duration, 'minutes').format('YYYYMMDDTHHmmss')}\n`;
      ics += `SUMMARY:Interview - ${interview.candidate}\n`;
      ics += `DESCRIPTION:Round ${interview.round} with ${interview.interviewer}\n`;
      ics += 'END:VEVENT\n';
    });
    
    ics += 'END:VCALENDAR\n';
    return ics;
  }

  setupReminders(interviews) {
    return interviews.map(interview => ({
      type: 'email',
      timing: '1 hour before',
      to: [interview.candidateEmail, interview.interviewerEmail],
      subject: `Reminder: Interview - ${interview.candidate}`
    }));
  }

  getAnalytics(scheduled) {
    return {
      total: scheduled.interviews.length,
      byRound: scheduled.interviews.reduce((acc, i) => {
        acc[i.round] = (acc[i.round] || 0) + 1;
        return acc;
      }, {}),
      conflictRate: (scheduled.conflicts.length / scheduled.interviews.length * 100).toFixed(1) + '%'
    };
  }
}

module.exports = InterviewSchedulerSkill;