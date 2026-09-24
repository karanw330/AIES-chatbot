import logging

from starlette.responses import JSONResponse

logging.basicConfig(level=logging.DEBUG)

import re
from dotenv import load_dotenv
load_dotenv()
from google import genai
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
#from pandas import read_csv
#import torch
#import pandas as pd
import fitz  # PyMuPDF
import uvicorn
from langchain.prompts import ChatPromptTemplate
# from fastapi.responses import JSONResponse
from langchain.schema import Document

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str

#-------------------------------------JSON response schema------------------------------------------#



#------------------------------- pdf text parsing ----------------------------------------#



source_pdf = fitz.open("Getting Started with Compute Simulation Instructions.pdf")
raw_pages = []
for page in source_pdf:
    raw_text = page.get_text()
    raw_pages.append(re.sub(r'\s+', ' ', raw_text))



#-------------------------------------- chunking process -----------------------------------------#


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=70
)
# print(raw_pages)
chunks = text_splitter.split_text("\n\n".join(raw_pages))
documents = [Document(page_content=chunk) for chunk in chunks]
# print(documents)


#------------------------------------- embedding model and vector store --------------------------------------#

embedding_model_id = "intfloat/e5-large-v2"
embeddings = HuggingFaceEmbeddings(
    model_name=embedding_model_id,
)

vector_store = Chroma(
    collection_name="compute_simulation_docs",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain_db",
)
vector_store.reset_collection()
vector_store.add_documents(documents)

print(vector_store._collection.count())

#------------------------------ LLM setup -----------------------------------------#

client = genai.Client()

#---------------------------------- alt model (local) ------------------------------------#



# model_id = "TheBloke/Mistral-7B-Instruct-v0.2-GGUF"
# tokenizer = AutoTokenizer.from_pretrained(model_id)
# bnb_config = BitsAndBytesConfig(
# load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_use_double_quant=True, bnb_4bit_compute_dtype="float16"
# )
#
# model = AutoModelForCausalLM.from_pretrained(
#     model_id,
#     # quantization_config=bnb_config,
#     device_map="auto"
# )
#
# pipe = pipeline(task="text-generation",
#     model=model,
#     tokenizer=tokenizer,
#     torch_dtype="auto",
#     do_sample=True,
#     temperature=0.1,
#     return_full_text=False,
#     max_new_tokens=200,
#     repetition_penalty=1.2)
#
# llm = HuggingFacePipeline(pipeline=pipe)


#------------------------------------ working process ----------------------------------------#



retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 2})

def qna(prompt):
    result = retriever.invoke(prompt)
    context = "theory: "
    th_context = "\n".join([doc.page_content for doc in result])
    context = context + th_context

    # print(context)

    in_prompt = ChatPromptTemplate.from_template(
        """
        You are AIES Chatbot, an AI assistant for Academic and research purposes. Answer the following query using the context:

        Query: {prompt}
        Context: {context}
                        Don't mention anything about getting a context, refrain from writing phrases like 'the given context provides'.
                        Give the output in the specified structure. """
    )
    formatted_prompt = in_prompt.format_prompt(
        prompt=prompt,
        context=context
    ).to_string()

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=formatted_prompt
    )

    return {"answer": response.text, "summary": response.text}
#-------------------------------------Fast API endpoint------------------------------------------#



@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    print(request.prompt)
    try:
        return JSONResponse(qna(request.prompt))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=5000, reload=True)

