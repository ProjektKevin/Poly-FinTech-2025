import os
from PIL import Image
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains.question_answering import load_qa_chain
from langchain_openai import OpenAI
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
import requests
from moviepy import VideoFileClip, concatenate_videoclips, AudioFileClip, concatenate_audioclips
import streamlit as st
import pyttsx3
import uuid


# Load environment variables from .env file
load_dotenv()

summaryQuery = "firstly summarize as detailed as you can in 3 paragraphs, it should be simplified too for 40-50 year olds to understand"

# Set API keys
giphyApiKey = os.getenv("GIPHY_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")

# Paths
BASE_PUBLIC_PATH = '../client/public'
GIFS_PATH = os.path.join(BASE_PUBLIC_PATH, "gifs")
AUDIOS_PATH = os.path.join(BASE_PUBLIC_PATH, "audios")
VIDEOS_PATH = os.path.join(BASE_PUBLIC_PATH, "videos")

if not openai_api_key:
    raise ValueError("OpenAI API key is not set. Please set it in the .env file.")

if not giphyApiKey:
    raise ValueError("Giphy API key is not set. Please set it in the .env file.")

def ensure_directories():
    for path in [GIFS_PATH, AUDIOS_PATH, VIDEOS_PATH]:
        os.makedirs(path, exist_ok=True)
        print(f"Ensured directory exists: {path}")

def generate_gifs(summary_text):
    keywords = [word.strip() for word in summary_text.split() if len(word) > 3 and word.isalpha()][:10]
    gif_urls = []
    print(f"Keywords for GIF search: {keywords}")

    for keyword in keywords:
        url = "http://api.giphy.com/v1/gifs/search"
        params = {
            "q": keyword,
            "api_key": giphyApiKey,
            "limit": 1
        }

        response = requests.get(url, params=params)
        print(f"Searching GIF for keyword: {keyword}, Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data["data"]:
                gif_url = data["data"][0]["images"]["original"]["url"]
                gif_urls.append(gif_url)
                print(f"Found GIF URL: {gif_url}")
            else:
                print(f"No GIF found for keyword: {keyword}")
        else:
            print(f"Failed to search GIF for keyword: {keyword}. Status code: {response.status_code}")

    return gif_urls

def download_gifs(gif_urls, request_id):
    local_gif_paths = []
    for i, url in enumerate(gif_urls):
        gif_filename = f"gif_{request_id}_{i}.gif"  # Add request_id
        gif_path = os.path.join(GIFS_PATH, gif_filename)
        r = requests.get(url, stream=True)
        print(f"Downloading GIF from URL: {url}, Status Code: {r.status_code}")

        if r.status_code == 200:
            with open(gif_path, 'wb') as f:
                for chunk in r.iter_content(1024):
                    f.write(chunk)
            local_gif_paths.append(gif_path)
            print(f"Downloaded GIF saved at: {gif_path}")
        else:
            print(f"Failed to download GIF from {url}. Status code: {r.status_code}")
    return local_gif_paths


def text_to_speech(text, request_id):
    filename = f"audio_{request_id}.mp3"  # Add request_id
    output_path = os.path.join(AUDIOS_PATH, filename)
    engine = pyttsx3.init()
    engine.save_to_file(text, output_path)
    engine.runAndWait()
    print(f"Audio saved to {output_path}")
    return output_path


def create_video_with_audio(local_gif_paths, audio_path, request_id):
    filename = f"video_{request_id}.mp4"
    output_path = os.path.join(VIDEOS_PATH, filename)
    try:
        # Load the audio file first to get its duration
        audio_clip = AudioFileClip(audio_path)
        audio_duration = audio_clip.duration
        print(f"Audio duration: {audio_duration} seconds")
        
        # Create video clips
        clips = [VideoFileClip(gif).with_duration(5) for gif in local_gif_paths]
        video_clip = concatenate_videoclips(clips, method="compose")
        
        # Loop the video to match or exceed audio duration
        if video_clip.duration < audio_duration:
            loops_needed = int(audio_duration / video_clip.duration) + 1
            looped_clips = [video_clip] * loops_needed
            video_clip = concatenate_videoclips(looped_clips, method="compose")
        
        # Trim video to exactly match audio duration
        video_clip = video_clip.subclipped(0, audio_duration)
        
        # Combine video and audio
        final_clip = video_clip.with_audio(audio_clip)
        final_clip.write_videofile(output_path, fps=24)
        
        print(f"Video with audio created successfully at {output_path}")
        print(f"Final video duration: {audio_duration} seconds")
        return output_path
    except Exception as e:
        print(f"An error occurred while creating the video with audio: {str(e)}")
        return None



def videoGenFunc(summary_text):
    ensure_directories()
    
    # Generate unique ID for this request
    request_id = str(uuid.uuid4())[:8]  # Short unique ID
    
    if summary_text:
        print("Summary:\n", summary_text)
        gif_urls = generate_gifs(summary_text)
        if gif_urls:
            local_gif_paths = download_gifs(gif_urls[:6], request_id)  # Pass request_id
            if local_gif_paths:
                output_audio_path = text_to_speech(summary_text, request_id)  # Pass request_id
                
                if os.path.exists(output_audio_path):
                    # Remove duration parameter - let audio determine length
                    output_video_path = create_video_with_audio(local_gif_paths, output_audio_path, request_id)

                    if output_video_path and os.path.exists(output_video_path):
                        print("Video with audio created successfully!")
                        return output_video_path, summary_text
                    else:
                        print("Failed to create the video with audio.")
                else:
                    print("Failed to generate audio.")
            else:
                print("Failed to download GIFs.")
        else:
            print("Failed to generate GIFs.")
    else:
        print("Failed to process PDF and generate summary.")
    return None, None



summary_text = """
    Oh no, it looks like all your answers were off — but don’t worry! Let’s clear things up together.

    First, Prudential’s Integrated Shield Plan doesn’t only cover cancer-related drugs. It actually provides 
    much broader coverage — from hospital stays in public or private hospitals, to surgeries, specialist visits, 
    and even pre- and post-hospitalisation treatment. The confusion probably comes from a new rule that only 
    certain cancer drugs are claimable under MediSave, but that rule applies to all insurers, not just Prudential.

    Second, yes — you can pay for Prudential’s ISP premiums using MediSave. There are age-based limits, but for 
    most people, part or even all of your premiums for the basic plan can be paid this way. That makes it more 
    affordable and accessible.

    And lastly, the premium for Prudential’s ISP is lower when you’re younger. That’s because health risks tend 
    to go up with age, so insurers adjust their prices accordingly. Getting insured earlier not only locks in lower 
    premiums — it also gives you peace of mind before health issues can catch you off guard.

    So now you know — getting the right coverage early is not just smart, it’s empowering!
"""

videoGenFunc(summary_text)
