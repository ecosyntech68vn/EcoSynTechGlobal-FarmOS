import torch
import torch.nn as nn
import numpy as np
import sys
import os

class IrrigationLSTM(nn.Module):
    def __init__(self, input_size=4, hidden_size=32, num_layers=2, output_size=1):
        super(IrrigationLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        out = self.fc(out)
        return out

def create_model():
    model = IrrigationLSTM()
    
    dummy_input = torch.randn(1, 3, 4)
    
    output_path = os.path.join(os.path.dirname(__file__), 'irrigation_lstm.onnx')
    
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"C: Created {output_path} ({size:.2f} MB)")

if __name__ == '__main__':
    create_model()