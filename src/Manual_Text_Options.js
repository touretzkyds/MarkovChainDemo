import React, {useState, useEffect} from "react";
import { useDictContext } from "./Context";

export default function ManualTextOptions(props){
    //Get dictionary, model type, generated text, and word count
    const {nGramDict, modelType, generatedText, setGeneratedText, currentWord, setCurrentWord, key, setKey, wordOptions, nodesAdded, setNodesAdded, setWordOptions} = useDictContext();
    //Inherit flag to signal manual text generation
    const {enableNextWord} = props;
    //Whether the display pane has been reset
    const [reset, setReset] = useState(false);
    //Display text
    let display_text = "";

    //Choose a word - set the chosen word as the current word, and update wordOptions with new values
    //Each time the enable boolean is altered, check to validate start
    useEffect(() => {
        setReset(false);
        //Verify manual text generation is enabled
        if (enableNextWord) {
            //Clear the current pane
            setGeneratedText("");
            setNodesAdded([]);
            //Clear all values
            setKey("")
            setWordOptions([])
            setCurrentWord("")
            display_text = "";
        }
    }, [enableNextWord, modelType])

    //Check whether the display pane has been reset
    useEffect(() => {
        if (generatedText === "" && key === "" && wordOptions.length === 0 && currentWord === "") {
            console.log("SUCCESSFULLY RESET.")
            setReset(true);
        }
    }, [generatedText, key, wordOptions, currentWord])

    //Once reset, randomly select a start word
    useEffect(() => {
        if (reset) {
            //Randomly select a word to begin with
            const dict_keys = Object.keys(nGramDict);
            const start_word = dict_keys[Math.floor(Math.random() * dict_keys.length)];
            setCurrentWord(start_word);
        }
    }, [reset])

    // //Each time the currentWord is updated, generate a new selection of words
    useEffect(() => {
        if (currentWord !== "" && currentWord !== undefined && reset) {
            //Display current word + previously generated text to pane
            display_text = generatedText + " " + currentWord;
            setGeneratedText(display_text);
            //Set to receive next series of words
            let values = []
            let sentence = ""
            //Change keys based on the model - use currentWord as key for bi-gram, the last word + currentWord for tri-gram, and the last two words + currentWord for the tetra-gram
            if (modelType === "Bi-gram"){
                //Get values via currentWord
                values = nGramDict[currentWord];
                //The key is simply the current word
                setKey(currentWord)
            } else if (modelType === "Tri-gram") {
                //Get last word
                sentence = generatedText.trim().split(" ");
                const last_word = sentence[sentence.length - 1]
                //Use as key
                const local_key = last_word + " " + currentWord
                //Get values
                values = nGramDict[local_key.trim()]
                //Set key
                setKey(local_key);
            } else if (modelType === "Tetra-gram") {
                //Get last two words
                sentence = generatedText.trim().split(" ");
                let last_word_2 = sentence[sentence.length - 2];
                let last_word_1 = sentence[sentence.length - 1];
                //If either is currently undefined, simply set to a blank space
                if (last_word_2 === undefined) {last_word_2 = "";}
                if (last_word_1 === undefined) {last_word_1 = "";}
                //Use as key
                const local_key = last_word_2 + " " + last_word_1 + " " + currentWord;
                //Get values
                values = nGramDict[local_key.trim()]
                //Set key
                setKey(local_key)
            }
            const new_words = [...values];
            //Set to word array
            setWordOptions(new_words);
        //If the current word is currently blank or undefined, begin definitions for the first time
        }
    }, [currentWord, reset])

    //Manage when a word is chosen
    const word_chosen = (button_element) => {
        //Check iterations - if the wordCount number of iterations have passed, set the word options to complete.
        //Get the chosen word
        const chosen_word = button_element.target.textContent;
        //Set 
        setCurrentWord(chosen_word);
    }

    return (
        <div className = "manual-text-pane" class = "flex flex-col w-3/12 p-2 space-y-2 h-full rounded-md outline outline-red-50 bg-white overflow-y-auto text-center items-center">
            <div className = "options-header" class = "flex font-bold">Choose next word:</div>
            {wordOptions.map((word, index) => (
                <button key = {index} onClick = {word_chosen} class = "flex w-full shadow-md text-center items-center justify-center rounded-3xl p-2 bg-zinc-50">{
                    word
                    }</button>
            ))}
        </div>
    )
}