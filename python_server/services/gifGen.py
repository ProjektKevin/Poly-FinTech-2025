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
import moviepy.editor as mp
import streamlit as st
import pyttsx3

# Load environment variables from .env file
load_dotenv()

summaryQuery = "firstly summarize as detailed as you can in 3 paragraphs, it should be simplified too for 40-50 year olds to understand"

# Set API keys
giphyApiKey = os.getenv("GIPHY_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")

pdf_path = "ws-simple-steps-to-save-water.pdf"

if not openai_api_key:
    raise ValueError("OpenAI API key is not set. Please set it in the .env file.")

if not giphyApiKey:
    raise ValueError("Giphy API key is not set. Please set it in the .env file.")

def process_pdf(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()

            text_splitter = CharacterTextSplitter(
                separator="\n",
                chunk_size=2500,
                chunk_overlap=100,
                length_function=len
            )

            chunks = text_splitter.split_text(text)

            embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
            knowledgeDB = FAISS.from_texts(chunks, embeddings)

            if knowledgeDB:
                docs = knowledgeDB.similarity_search(summaryQuery)
                llm = OpenAI(api_key=openai_api_key)
                chain = load_qa_chain(llm, chain_type="stuff")
                summary_response = chain.invoke({"input_documents": docs, "question": summaryQuery})
                summary_text = summary_response['output_text']
                return summary_text
            else:
                print("Failed to create knowledge database from the PDF.")
                return None

    except Exception as e:
        print(f"An error occurred while processing the PDF: {str(e)}")
        return None

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

def download_gifs(gif_urls):
    local_gif_paths = []
    for i, url in enumerate(gif_urls):
        gif_path = f"gif_{i}.gif"
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

def text_to_speech(text, output_path):
    engine = pyttsx3.init()
    engine.save_to_file(text, output_path)
    engine.runAndWait()
    print(f"Audio saved to {output_path}")

def create_video_with_audio(local_gif_paths, audio_path, output_path, duration):
    try:
        clips = [mp.VideoFileClip(gif).set_duration(5) for gif in local_gif_paths]
        video_clip = mp.concatenate_videoclips(clips, method="compose")
        
        # Loop the video if it's shorter than the desired duration
        if video_clip.duration < duration:
            video_clip = video_clip.loop(duration=duration)
        
        # Trim the video clip to exactly match the desired duration
        video_clip = video_clip.subclip(0, duration)

        # Load the audio file
        audio_clip = mp.AudioFileClip(audio_path)

        # If audio is longer than video, trim it
        if audio_clip.duration > video_clip.duration:
            audio_clip = audio_clip.subclip(0, video_clip.duration)
        
        # If audio is shorter than video, loop it
        elif audio_clip.duration < video_clip.duration:
            audio_clip = audio_clip.loop(duration=video_clip.duration)

        # Set the audio of the video clip
        final_clip = video_clip.set_audio(audio_clip)

        final_clip.write_videofile(output_path, fps=24)
        print(f"Video with audio created successfully at {output_path}")
    except Exception as e:
        print(f"An error occurred while creating the video with audio: {str(e)}")

def main(pdf_path):
    summary_text = process_pdf(pdf_path)
    if summary_text:
        print("Summary:\n", summary_text)
        gif_urls = generate_gifs(summary_text)
        if gif_urls:
            local_gif_paths = download_gifs(gif_urls[:6])  # Limiting to 6 gifs
            if local_gif_paths:
                output_audio_path = "output_audio.mp3"
                text_to_speech(summary_text, output_audio_path)
                
                if os.path.exists(output_audio_path):
                    output_video_path = "output_video_with_audio.mp4"
                    create_video_with_audio(local_gif_paths, output_audio_path, output_video_path, 30)  # 30-second video

                    if os.path.exists(output_video_path):
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

output_video_path, summary_text = main(pdf_path)

if output_video_path and os.path.exists(output_video_path):
    st.title("Converting Raw Data Into New Knowledge")
    st.video(output_video_path)
    st.success("Here is your generated video!")
    st.subheader("Summary of the PDF:")
    st.write(summary_text)
else:
    st.error("Failed to generate video. Please check the logs for more details.")