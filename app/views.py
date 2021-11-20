from logging import warning
import os
from app import app, intelligence, ml
import urllib.request
from flask import Flask, flash, request, redirect, url_for, render_template, jsonify
from werkzeug.utils import secure_filename



ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif'])

def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
	
@app.route('/')
def upload_form():
	return render_template('drag_n_drop.html')

@app.route('/', methods=['POST'])
def upload_image():
	if 'files[]' not in request.files:
		flash('No file part')
		return redirect(request.url)
	files = request.files.getlist('files[]')

	file_paths = {}
	for file in files:
		if file and allowed_file(file.filename):
			filename = secure_filename(file.filename)
			path = f"/static/uploads/{filename}"
			# path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
			file.save(path)
			file_paths[filename] = path

	
	result_files = {}
	for filename, path in file_paths.items():
		leaf_file = intelligence.find_leafs(path)
		ml_file = ml.detect_strawsberry(path, ml.model)
		result_files['open_cv'] = render_template('result_item.html', filename=leaf_file)
		result_files['original'] = render_template('result_item.html', filename=filename)
		ml_file = ml_file.replace('/static/uploads/', '')
		result_files['ml'] = render_template('result_item.html', filename=ml_file)
	# return render_template('result.html', filenames=result_files)
	return jsonify(result_files)

@app.route('/display/<filename>')
def display_image(filename):
	#print('display_image filename: ' + filename)
	return redirect(url_for('static', filename='uploads/' + filename), code=301)