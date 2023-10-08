import React, {useState, useEffect} from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
import { useDictContext } from "./Context";

export default function GenerateDict(props){
    //Get dictionary, branching factor, and number of bigrams from context manager
    const {inputText, setInputText, nGramDict, setNGramDict, modelType, setModelType, setGeneratedText, wordCount, textGenMode, build_dictionary, generate_text} = useDictContext();
    
    //Enabling the Re-build button
    let [enableButton, setEnableButton] = useState(false);
    //Text provided state
    let [validText, setValidText] = useState(true);
    //Dictionary generated state
    let {dictGenerated, setDictGenerated} = props;

    //When text is entered into the textarea
    const textRetrieval = (text) => {
        //Set input text
        setInputText(text.target.value)
        //Check if we are not currently performing manual text generation
        if (textGenMode != "manual") {
            //Enable the Re-Build Dictionary Button
            setEnableButton(true);
        }
    }
    
    //When the re-build dictionary button is clicked
    const rebuild_dict_clicked = () => {
        //Verify that adequate text has been provided
        if (inputText.split(/\s+/).filter(word => word !== "").length < 2) {
            setValidText(false);
        }
        else {setValidText(true);}
        if (validText) {
            //Update nGram dictionary
            setNGramDict(build_dictionary(inputText, modelType));
            //Set enable button to false
            setEnableButton(false);
        }

    }

    //When a model option is selected
    const modelSelect = (selection) => {
        //Check if the button is disabled.
        //If so, a change should trigger the generation of a novel dictionary and text generation.
        //Otherwise, simply update the state.
        setModelType(selection.target.value)
    }

    //Use Effect -> builds dictionary and generates text each time the model type is changed and the enable button is disabled.
    useEffect (() => {
        //Check if the button is not enabled and that manual text generation is not currently being done
        if (!enableButton) {
            //Trigger dictionary generation
            setNGramDict(build_dictionary(inputText, modelType));
        }
    }, [modelType])

    //Generate Text when the dictionary is altered. 
    useEffect(() => {
        //Check to verify that manual text generation has not taken place
        if (textGenMode != "manual") {
            setGeneratedText(generate_text(nGramDict, modelType, wordCount));
        }
    }, [nGramDict, modelType, wordCount])

    //HTML
    return (
        <div className = "text-processing" class = "flex flex-col space-y-2 h-full w-full items-center justify-center rounded-md bg-zinc-50 drop-shadow-md" >
            <div className = "panel-1-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-2">
                <p className = "text-entrance-text" class = "flex-auto monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs font-bold w-4/12">[1] Provide a Passage; Choose a Model.</p>
                    <div className = "n-gram-selection" class = "flex-auto flex-col w-1/6 align-center text-center items-center justify-center">
                        <label class = "text-center monitor:text-sm 2xl:text-sm xl:text-sm sm:text-xs">Select model type:</label>
                        <select name = "n-gram-model-type" id = "n-gram-model-type" defaultValue = {modelType} onChange = {modelSelect} class = "flex-auto mx-auto block align-center items-center justify-center h-fit w-8/12 monitor:text-sm 2xl:text-sm xl:text-sm sm:text-xs rounded-md outline outline-slate-200 outline-3 focus:outline-none focus:ring text-center">
                            <option key = "Bi-gram">Bi-gram</option>
                            <option key = "Tri-gram">Tri-gram</option>
                            <option key = "Tetra-gram">Tetra-gram</option>
                        </select>
                    </div>
                { enableButton ? (
                    <button className = "build-ngram-dict" onClick = {rebuild_dict_clicked} class = "flex-auto monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs bg-black text-white font-bold rounded-md w-2/12 h-10 outline outline-1 hover:bg-slate-700 hover:ring">Re-Build Dictionary</button>
                ) : (
                    <button className = "build-ngram-dict" class = "flex-auto monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs bg-gray-200 text-gray-300 font-bold rounded-md monitor:w-2/12 2xl:w-3/12 h-10 outline outline-1">Re-Build Dictionary</button>
                )}
            </div>
            
            <textarea className = "gram-model-text" type = "textarea" defaultValue = {inputText} onChange = {textRetrieval} class = "rounded-md p-2 h-5/6 w-11/12 outline outline-slate-200 focus:outline-none focus:ring focus:border-slate-500"></textarea>
            {/* Display the text generation option if clicked is true*/}
            {validText ? (
                <div></div>
            ) : (
                <div className = "no-text-provided" class = "text-red-500 text-sm font-bold">Please provide a sample input passage with at least 2 words.</div>
            )}
        </div>
    )
}