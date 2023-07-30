import React, {useState, useEffect} from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
import DisplayDict from "./Display_Dict";
axios.defaults.baseURL = "http://localhost:3001"

export default function GenerateDict(props){
    //Model type
    let [model_type, setModelType] = useState("Bi-gram");
    //Input text
    let [input_text, setInputText] = useState("");
    //N-gram dictionary
    let [returned_dict, setReturnedDict] = useState({})
    //Branching factor and length of dictionary (to diisplay as statistics)
    let [branching_factor, setBranchingFactor] = useState(0);
    let [len_dict, setLenDict] = useState(0);
    //Child window
    let [dictWindow, setDictWindow] = useState(null);
    //Text provided state
    let [textProvided, setTextProvided] = useState(true);
    //Dictionary generated state
    let {userID, setDictGenerated} = props;

    //When text is entered into the textarea
    const textRetrieval = (text) => {
        //Set input text
        setInputText(text.target.value)
    }

    //When a model option is selected
    const modelSelect = (selection) => {
        console.log(model_type);
        //Save model type
        setModelType(selection.target.value);
        console.log(selection.target.value);
    }

    //Post to the backend API and retrieve the generated dictionary, branching factor, and total number of entries.
    const generate_ngram_dict = () => {
        //Send a POST request to the backend with the input text and model type
        console.log(userID);
        const postText = {
            "userID" : userID,
            "input_text" : input_text,
            "n_gram_type" : model_type,
        };
        //Post configuration
        const postConfig = {
            headers : {
                "Content-Type" : "application/json",
            },
        };
        //Post
        axios.post("/generate-ngram-dictionary", postText, postConfig)
        .then((response) => {
            //Set bigram dictionary
            setReturnedDict(response.data["gram_dict"]);
            //Set branching factor
            setBranchingFactor(response.data["b_factor"]);
            //Set dict length
            setLenDict(response.data["n_entries"]);
        }).catch((error) => {
            console.log(error);
        })

    };

    //When the "Build Dictionary" Button is clicked. 
    const build_dictionary = () => {
        //Check if the number of words is greater than or equal to two
        if (input_text.split(' ').filter(word => word !== '').length >= 2) {
            //Set text state to true
            setTextProvided(true);
            //Set the dictionary generated state to true
            setDictGenerated(true);
            //Obtain dictionary, branching factor, and number of entries
            generate_ngram_dict();
            //Open a seperate window
            const dict_window = window.open('', '_blank');
            dict_window.document.title = "N-Gram Dictionary and Statistics.";
            dict_window.document.body.innerHTML = "<div id = 'root_div' className = 'dict-page' class = 'flex flex-col h-screen w-screen items-center justify-center py-8'></div>";
            //Set the window to the object
            setDictWindow(dict_window);
        } else {
            //Set the state to false and display the error message
            setTextProvided(false);
            setDictGenerated(false);
        }

    }   

    //UseEffect to manage child component data, ensuring that the dictionary and statistics are up to date.
    useEffect(() => {
        if (dictWindow) {
            ReactDOM.render(<DisplayDict dict = {returned_dict} branching_factor = {branching_factor} num_entries = {len_dict}/>, dictWindow.document.getElementById('root_div'))
        }
    }, [dictWindow, returned_dict, branching_factor, len_dict])

    //HTML
    return (
        <div className = "text-processing" class = "flex flex-col space-y-5 h-3/6 w-full items-center justify-center" >
          <p className = "text-entrance-text" class = "font-bold">Enter a sample passage below and choose an n-gram model to get started:</p>
          <textarea className = "gram-model-text" type = "textarea" defaultValue = "Paste your passage here..." onChange = {textRetrieval} class = "rounded-md p-2 h-5/6 w-8/12 outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500 "></textarea>
          <div className = "n-gram-selection" class = "flex flex-row space-x-4 w-3/6 align-center justify-center">
            <label class = "">Select n-gram type:</label>
              <select name = "n-gram-model-type" id = "n-gram-model-type" defaultValue = "bi-gram" onChange = {modelSelect} class = "h-fit w-2/6 rounded-md outline outline-slate-200 outline-3 focus:outline-none focus:ring text-center">
                <option key = "bi-gram">Bi-gram</option>
                <option key = "tri-gram">Tri-gram</option>
                <option key = "tetra-gram">Tetra-gram</option>
              </select>
          </div>
          <button className = "build-ngram-dict" onClick = {build_dictionary} class = "bg-black text-white font-bold rounded-md w-2/12 h-10 outline outline-1 hover:bg-slate-700 hover:ring">Build Dictionary</button>
          {/* Display the text generation option if clicked is true*/}
          {textProvided ? (
            <div></div>
          ) : (
            <div className = "no-text-provided" class = "text-red-500 font-bold">Please provide a sample input passage with at least 2 words.</div>
          )}
        </div>
    )
}