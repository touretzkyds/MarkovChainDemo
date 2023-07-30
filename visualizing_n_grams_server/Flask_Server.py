from flask import Flask
from flask import request
from flask import session
import secrets
import uuid
import numpy as np
import json
#Import helper functions from utils.py
from utils import get_words, make_bigram_dict, make_trigram_dict, branching_factor
from utils import gen_bigram, gen_trigram, branching_factor

#Declare application
server = Flask(__name__)
server.secret_key = secrets.token_hex(32)
#Session lifetime
server.config["PERMANENT_SESSION_LIFETIME"] = 1800
#User data
ALL_USER_DATA = {}

#Set app routes

#Default route
@server.route("/")
def response():
    return "Server Root Directory Accessed."

#For generating the n-gram dictionary
@server.route("/generate-ngram-dictionary", methods = ["POST"])
def generate_ngram_dictionary():
    #Get user ID
    userID = request.json["userID"]
    #Get input text (sample passage)
    sample_input_passage = request.json["input_text"]
    #Get model type
    model_type = request.json["n_gram_type"]
    #Generate Bi-gram or Tri-gram dictionary
    if model_type == "Bi-gram": gram_dict = make_bigram_dict(text_string = sample_input_passage)
    elif model_type == "Tri-gram": gram_dict = make_trigram_dict(text_string = sample_input_passage)
    session["model_type"] = model_type
    print("Gram Dictionary", gram_dict)
    #Store model type and dictionary
    ALL_USER_DATA[userID] = {"model_type" : model_type, "gram_dict" : gram_dict}
    #Calculate branching factor and number of entries
    b_factor = branching_factor(gram_dict)
    n_entries = len(gram_dict)
    #Return to frontend
    return {"gram_dict" : gram_dict, "b_factor" : round(b_factor, 3), "n_entries" : n_entries}

#For generating text based on the n-gram model
@server.route("/generate-ngram-text", methods = ["GET"])
def generate_ngram_text():
    #Get user ID
    userID = request.args.get("userID")
    #Get model type and dictionary
    model_type, gram_dict = ALL_USER_DATA[userID]["model_type"], ALL_USER_DATA[userID]["gram_dict"]
    #Generate passage
    if model_type == "Bi-gram": gen_passage = gen_bigram(bigram_dict = gram_dict)
    elif model_type == "Tri-gram": gen_passage = gen_trigram(trigram_dict = gram_dict)
    #Return generated passage
    print("Generated passage:", gen_passage)
    return {"generated_passage" : gen_passage}

#Allow cross-origin requests
@server.after_request
def set_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    return response

#Run server on port 3001
if __name__ == "__main__":
    server.run(debug = True, port = 3001)