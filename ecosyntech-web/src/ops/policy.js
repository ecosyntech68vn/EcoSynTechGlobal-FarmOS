class Policy {
  match(event, registry) {
    const list = [...registry.values()];
    return list.filter(skill => {
      if (!Array.isArray(skill.triggers)) return false;
      return skill.triggers.some(trigger => {
        if (trigger === event.type || trigger === `event:${event.type}`) return true;
        if (event.route && trigger === `route:${event.route}`) return true;
        if (event.topic && trigger === `topic:${event.topic}`) return true;
        return false;
      });
    });
  }
}

module.exports = { Policy };