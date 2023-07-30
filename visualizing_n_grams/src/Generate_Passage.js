import React, {useState, useEffect} from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
axios.defaults.baseURL = "http://localhost:3001"

//Function
export default function GeneratePassage(props){
    //Get user ID
    const {userID} = props;
    //Declare generated text
    let [generatedText, setGeneratedText] = useState("Generated text will appear here.");
    //When the generate button is clicked, perform a get request and retrieve the generated text.
    const generateText = () => {
        console.log(userID);
        //Get request
        axios.get("/generate-ngram-text?userID=" + userID).then((response) => {
            //Set generated text to response
            setGeneratedText(response.data["generated_passage"]);
        }).catch((error) => {
            console.log(error);
        })
    }
    return (
        <div className = "generated-passage-section" class = "flex flex-col space-y-2 h-3/6 w-full align-center text-center items-center justify-center">
            <div className = "generated-text" class = "font-bold">Now, click the following button to generate a passage based on the n-gram.</div>
            <button className = "build-ngram-dict" onClick = {generateText} class = "bg-red-500 text-white font-bold rounded-md w-2/12 py-2 h-10 outline outline-1 hover:bg-slate-700 hover:ring">Generate Text</button>
            <div className = "generated-text" class = "w-10/12 h-5/6 outline outline-red-100 rounded-md overflow-y-auto p-2 text-left">{generatedText}</div>
        </div>
    )
}