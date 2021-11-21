import os
import torch
from torch import nn
from torchvision import datasets, transforms, models
from PIL import Image
 
# Use the torchvision's implementation of ResNeXt, but add FC layer for a different number of classes (27) and a Sigmoid instead of a default Softmax.
class Resnext50(nn.Module):
    def __init__(self, n_classes):
        super().__init__()
        resnet = models.resnext50_32x4d(pretrained=False)
        resnet.fc = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(in_features=resnet.fc.in_features, out_features=n_classes)
        )
        self.base_model = resnet
        self.sigm = nn.Sigmoid()
 
    def forward(self, x):
        return self.base_model(x)
 
def detect_disease(picture_path, weights_path):
    # Initialize the model
    model = Resnext50(7)
    # Switch model to the training mode
    model.eval()
    model.load_state_dict(torch.load(weights_path))
    classes = ['angular_leafspot', 'anthracnose_fruit_rot', 'blossom_blight', 'gray_mold',
               'leaf_spot', 'powdery_mildew_fruit', 'powdery_mildew_leaf']
 
    for f in [1, 2, 3, 4]:
        img = Image.open(picture_path).convert('RGB')
        x = transforms.Compose([transforms.Resize((224, 224)),
                                transforms.ToTensor(),
                                transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225))])(img)
        with torch.no_grad():
            x = x[None]
            predict_proba = model(x)[0]
            predict_proba = torch.sigmoid(predict_proba).numpy()
 
        threshold = 0.5
        result = ''
 
        for cls, proba in zip(classes, predict_proba):
            print(f"{cls:<30s}", f"{proba:.3f}", proba > threshold)
            result += str(f"{cls:<30s}") + str(f"{proba:.3f}") + str(proba > threshold) + '\n'
 
        return result