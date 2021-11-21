import os
import torch
import torchvision
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor
import cv2
import numpy as np
import math
from PIL import Image
from torchvision import transforms as T
 


def init_model():
    num_classes = 2
    model = __get_instance_segmentation_model(num_classes)
    model.load_state_dict(torch.load('rcnn_demo.pt'))
    model.eval()
    return model

def crop_image(img, x1, y1, x2, y2):
    min_x = min(x1, x2)
    max_x = max(x1, x2)
    min_y = min(y1, y2)
    max_y = max(y1, y2)
    return img[min_y:max_y, min_x:max_x]

def distance(c1, c0):
    r1, g1, b1 = map(lambda x: x / 255.0, c1)
    r2, g2, b2 = map(lambda x: x / 255.0, c0)
    distance = math.sqrt((r2-r1)**2+(g2-g1)**2+(b2-b1)**2)
    return distance

def ripeness(mean_color):
    ripe_color = (136, 23, 13)
    ripeness = min(1.0, (1.0 - distance(ripe_color, mean_color)) / 0.9)
    return ripeness

def crop_image(img, x1, y1, x2, y2):
    min_x = min(x1, x2)
    max_x = max(x1, x2)
    min_y = min(y1, y2)
    max_y = max(y1, y2)
    return img[min_y:max_y, min_x:max_x, :]

def unique_count_app(a):
    colors, count = np.unique(a.reshape(-1,a.shape[-1]), axis=0, return_counts=True)
    return colors[count.argmax()]

def strawberry_ripeness(img):
    img = crop_image(img, int(img.shape[0]/3), int(img.shape[1]/3), int(2*img.shape[0]/3), int(2*img.shape[1]/3))
    img_hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    color = unique_count_app(img)
    return ripeness(color)
 
def detect_strawsberry(picture_path, model):
    print('Loaded')
 
    img = __load_img(picture_path)
    img.max()
 
    transforms = T.Compose([T.ToPILImage(),
                            T.Resize((512, 512)),
                            T.ToTensor()])
 
    img_tensor = transforms(img)
 
    with torch.no_grad():
        prediction = model(img_tensor[None])
 
    scale1 = img.shape[1] / img_tensor.shape[2]
    scale2 = img.shape[0] / img_tensor.shape[1]
    print(scale1, scale2)
 
    # draw results
    res = img.astype(np.uint8).copy()
 
    boxes = prediction[0]['boxes']
    scores = prediction[0]['scores']
    print(boxes, scores)
 
    font = cv2.FONT_HERSHEY_SIMPLEX
    fontScale = 1.0
    fontColor = (255, 0, 0)
    thickness = 1
    lineType = 1
 
    for box, score in zip(boxes, scores):
        x1, y1, x2, y2 = box.cpu().numpy()
        # upscale
        x1 *= scale1
        x2 *= scale1
        y1 *= scale2
        y2 *= scale2
        if score > 0.9:
            p1 = int(x1), int(y1)
            p2 = int(x2), int(y2)
            cv2.rectangle(res, p1, p2, (int(255 * score), 0, 0), 2)
            ripeness = strawberry_ripeness(crop_image(res, int(x1), int(y1), int(x2), int(y2)))
            cv2.putText(res, f"{ripeness:.3f}",
                        p1,
                        font,
                        fontScale,
                        fontColor,
                        thickness,
                        lineType)
 
    filename, ext = os.path.splitext(picture_path)
    Image.fromarray(res).save(filename + '_detected.jpeg')
    return filename + '_detected.jpeg'
 
 
def __get_instance_segmentation_model(num_classes):
    # load an instance segmentation model pre-trained on COCO
    model = torchvision.models.detection.maskrcnn_resnet50_fpn(pretrained=True)
 
    # get number of input features for the classifier
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    # replace the pre-trained head with a new one
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
 
    # now get the number of input features for the mask classifier
    in_features_mask = model.roi_heads.mask_predictor.conv5_mask.in_channels
    hidden_layer = 256
    # and replace the mask predictor with a new one
    model.roi_heads.mask_predictor = MaskRCNNPredictor(in_features_mask,
                                                       hidden_layer,
                                                       num_classes)
    return model
 
 
def __load_img(path):
        img = Image.open(path).convert('RGB')
        return np.array(img)

model = init_model()