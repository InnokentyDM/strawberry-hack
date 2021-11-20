// where files are dropped + file selector is opened
var dropRegion = document.getElementById("drop-region");
// where images are previewed
var imagePreviewRegion = document.getElementById("image-preview");

var result = document.getElementById('result');


// open file selector when clicked on the drop region
var fakeInput = document.createElement("input");
fakeInput.type = "file";
fakeInput.accept = "image/*";
fakeInput.multiple = true;
dropRegion.addEventListener('click', function () {
    fakeInput.click();
});

fakeInput.addEventListener("change", function () {
    var files = fakeInput.files;
    handleFiles(files);
});


function preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
}

dropRegion.addEventListener('dragenter', preventDefault, false)
dropRegion.addEventListener('dragleave', preventDefault, false)
dropRegion.addEventListener('dragover', preventDefault, false)
dropRegion.addEventListener('drop', preventDefault, false)


function handleDrop(e) {
    var dt = e.dataTransfer,
        files = dt.files;

    if (files.length) {

        handleFiles(files);

    } else {

        // check for img
        var html = dt.getData('text/html'),
            match = html && /\bsrc="?([^"\s]+)"?\s*/.exec(html),
            url = match && match[1];



        if (url) {
            uploadImageFromURL(url);
            return;
        }

    }


    function uploadImageFromURL(url) {
        var img = new Image;
        var c = document.createElement("canvas");
        var ctx = c.getContext("2d");

        img.onload = function () {
            c.width = this.naturalWidth;     // update canvas size to match image
            c.height = this.naturalHeight;
            ctx.drawImage(this, 0, 0);       // draw in image
            c.toBlob(function (blob) {        // get content as PNG blob

                // call our main function
                handleFiles([blob]);

            }, "image/png");
        };
        img.onerror = function () {
            alert("Error in uploading");
        }
        img.crossOrigin = "";              // if from different origin
        img.src = url;
    }

}

dropRegion.addEventListener('drop', handleDrop, false);



function handleFiles(files) {
    clearResultRegion();
    clearImagePreviewRegion();
    for (var i = 0, len = files.length; i < len; i++) {
        if (validateImage(files[i]))
            previewAnduploadImage(files[i]);
    }
}

function validateImage(image) {
    // check the type
    var validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (validTypes.indexOf(image.type) === -1) {
        alert("Invalid File Type");
        return false;
    }

    // check the size
    var maxSizeInBytes = 10e6; // 10MB
    if (image.size > maxSizeInBytes) {
        alert("File too large");
        return false;
    }

    return true;

}

function clearImagePreviewRegion() {
    imagePreviewRegion.innerHTML = "";
}

function clearResultRegion() {
    result.innerHTML = "";
    var expandImg = document.getElementById("expandedImg");
    expandImg.src = "";
}

function previewAnduploadImage(image) {

    // container
    var imgView = document.createElement("div");
    imgView.className = "image-view";



    // previewing image
    var img = document.createElement("img");
    img.setAttribute('style', 'position: relative;z-index: 1;');
    imgView.appendChild(img);

    // append progress bar
    var progress = document.createElement("img");
    progress.className = 'progress';
    progress.setAttribute("src", "/static/images/progress.gif");
    progress.setAttribute('style', "position: absolute;left:0px; top: 0px;z-index: 10; opacity:0.9;");
    imgView.appendChild(progress);

    imagePreviewRegion.appendChild(imgView);
    

    // progress overlay
    var overlay = document.createElement("div");
    overlay.className = "overlay";
    imgView.appendChild(overlay);


    // read the image...
    var reader = new FileReader();
    reader.onload = function (e) {
        img.src = e.target.result;
    }
    reader.readAsDataURL(image);

    // create FormData
    var formData = new FormData();
    formData.append('files[]', image);

    // upload the image
    var uploadLocation = '/';
    // formData.append('key', 'bb63bee9d9846c8d5b7947bcdb4b3573');

    var ajax = new XMLHttpRequest();
    ajax.open("POST", uploadLocation, true);

    ajax.onreadystatechange = function (e) {
        if (ajax.readyState === 4) {
            if (ajax.status === 200) {
                var result = document.getElementById('result');
                var el = document.createElement('div');
                el.className = 'column';
                el.innerHTML = ajax.response;
                result.append(el);
                console.log('appended');
                progress.remove();
                imgView.remove();
                console.log('removed');
                var expandImg = document.getElementById("expandedImg");
                expandImg.parentElement.style.display = "block";
                expandImg.src = el.getElementsByTagName("img")[0].src;;
            } else {
                console.log('fail');
                progress.remove()
            }
        }
    }

    ajax.upload.onprogress = function (e) {

        // change progress
        // (reduce the width of overlay)

        var perc = (e.loaded / e.total * 100) || 100,
            width = 100 - perc;

        overlay.style.width = width;
    }

    ajax.send(formData);

}

function myFunction(imgs) {
    // Get the expanded image
    var expandImg = document.getElementById("expandedImg");
    // Get the image text
    var imgText = document.getElementById("imgtext");
    // Use the same src in the expanded image as the image being clicked on from the grid
    expandImg.src = imgs.src;
    // Use the value of the alt attribute of the clickable image as text inside the expanded image
    imgText.innerHTML = imgs.alt;
    // Show the container element (hidden with CSS)
    expandImg.parentElement.style.display = "block";
}