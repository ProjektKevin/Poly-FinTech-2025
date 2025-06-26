from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from services.gifVideoGen import videoGenFunc
import os

app = Flask(__name__)
CORS(app)

# default api route
@app.route('/')
def home():
    return '<h1>API is Running</h1>'

# Generate video from text route
@app.route('/api/generate-video', methods=['POST'])
def generate_video_route():
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text field is required'}), 400
        
        text = data['text']
        
        # Call your existing video generation function
        output_video_path, summary_text = videoGenFunc(text)
        
        if output_video_path:
            # Extract just the filename from the full path
            video_filename = os.path.basename(output_video_path)
            
            return jsonify({
                'success': True,
                'video_filename': video_filename,
                'message': 'Video generated successfully'
            })
        else:
            return jsonify({'error': 'Failed to generate video'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500

# For standalone testing
if __name__ == '__main__':
    app.run(debug=True)