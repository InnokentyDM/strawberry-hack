import cv2
import numpy as np
import os.path
 
# image_name = "image.jpg"
def find_leafs(image_name):
    img = cv2.imread(image_name)
 
    ## convert to hsv
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, (36, 10, 25), (70, 255,255))
 
    # remove noise - closing opening algorithm
    kernel_size = int(0.005 * img.shape[0])
    kernel = np.ones((kernel_size,kernel_size), np.uint8)
    closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    
    ## slice the green
    imask = mask>0
    green = np.zeros_like(img, np.uint8)
    green[imask] = img[imask]
    
    result = cv2.cvtColor(green, cv2.COLOR_BGR2RGB)
 
    filenamewithext = os.path.basename(image_name)
    filename, ext = os.path.splitext(filenamewithext)
    result_filename = f"/static/uploads/{filename}_leaf{ext}"
    
    new_filename = f"{filename}_leaf{ext}"
    cv2.imwrite(result_filename, result)
    
    return new_filename