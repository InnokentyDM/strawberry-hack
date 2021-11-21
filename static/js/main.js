// where files are dropped + file selector is opened
var dropRegion = document.getElementById("drop-region");
// where images are previewed
var imagePreviewRegion = document.getElementById("image-preview");

var result = document.getElementById('result');

var img_storage = {};

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
    img_storage = {};
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
    var mlImg = document.getElementById("ml");
    mlImg.src = "";
    var opencvImg = document.getElementById("opencv");
    opencvImg.src = "";
    var imgtext = document.getElementById('imgtext');
    imgtext.innerHTML = "";
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
                var response_data = JSON.parse(ajax.response);

                var el = document.createElement('div');
                el.className = 'column';
                el.innerHTML = response_data['original'];

                var original_file_src = el.getElementsByTagName("img")[0].src;

                var open_cv_el = document.createElement('div');
                open_cv_el.innerHTML = response_data['open_cv'];
                var open_cv_src = open_cv_el.getElementsByTagName("img")[0].src;

                var ml_el = document.createElement('div');
                ml_el.innerHTML = response_data['ml'];
                var ml_src = ml_el.getElementsByTagName("img")[0].src;

                img_storage[original_file_src] = {
                    'original': original_file_src, 
                    'open_cv': open_cv_src, 
                    'ml': ml_src,
                    'deseases': response_data['deseases']
                };

                var imgtext = document.getElementById('imgtext');
                imgtext.innerHTML = "";
                var p = document.createElement("p");
                p.textContent = response_data["deseases"];
                p.style = "white-space: pre-line;";
                imgtext.append(p);

                result.append(el);
                progress.remove();
                // imgView.remove();

                var mlImg = document.getElementById("ml");
                mlImg.parentElement.style.display = "block";
                mlImg.src = ml_src;
                
                var opencvImg = document.getElementById("opencv");
                opencvImg.parentElement.style.display = "block";
                opencvImg.src = open_cv_src;

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
    var images = img_storage[imgs.src];
    var mlImg = document.getElementById("ml");
    mlImg.src = images['ml'];
    var opencvImg = document.getElementById("opencv");
    opencvImg.src = images['open_cv'];
    mlImg.parentElement.style.display = "block";    


    var imgtext = document.getElementById('imgtext');
    imgtext.innerHTML = "";
    var p = document.createElement("p");
    p.style = "white-space: pre-line;";
    p.textContent = images["deseases"];
    imgtext.append(p);
}