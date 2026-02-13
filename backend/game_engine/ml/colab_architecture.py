import torch
import torch.nn as nn

class StockPredictor(nn.Module):
    """
    Standard LSTM architecture matching the Colab training script.
    Input: (Batch, Seq_Len, Features)
    Output: (Batch, 1) -> Scaled Return
    """
    def __init__(self, input_dim=5, hidden_dim=64, num_layers=2, output_dim=1):
        super(StockPredictor, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # LSTM Layer
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        
        # Fully Connected Layer to map output to single value
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        # Initialize hidden state and cell state
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = self.fc(out[:, -1, :])
        return out
