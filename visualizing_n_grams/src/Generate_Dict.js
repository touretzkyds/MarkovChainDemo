import React, {useState, useEffect} from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
import { useDictContext } from "./Context";

export default function GenerateDict(props){
    //Get dictionary, branching factor, and number of bigrams from context manager
    const {nGramDict, setNGramDict, modelType, setModelType, setGeneratedText, wordCount, build_dictionary, generate_text} = useDictContext();
    //Input text
    let [inputText, setInputText] = useState(
        "From this distant vantage point, the Earth might not seem of any particular interest. But for us, it's different. Consider again at that dot. That's here. That's home. That's us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives. The aggregate of our joy and suffering, thousands of confident religions, ideologies, and economic doctrines, every hunter and forager, every hero and coward, every creator and destroyer of civilization, every king and peasant, every young couple in love, every mother and father, hopeful child, inventor and explorer, every teacher of morals, every corrupt politician, every 'superstar,' every 'supreme leader,' every saint and sinner in the history of our species lived there--on a mote of dust suspended in a sunbeam.\n\n" +
        "The Earth is a very small stage in a vast cosmic arena. Think of the rivers of blood spilled by all those generals and emperors so that, in glory and triumph, they could become the momentary masters of a fraction of a dot. Think of the endless cruelties visited by the inhabitants of one corner of this pixel on the scarcely distinguishable inhabitants of some other corner, how frequent their misunderstandings, how eager they are to kill one another, how fervent their hatreds.\n\n" +
        "Our posturings, our imagined self-importance, the delusion that we have some privileged position in the Universe, are challenged by this point of pale light. Our planet is a lonely speck in the great enveloping cosmic dark. In our obscurity, in all this vastness, there is no hint that help will come from elsewhere to save us from ourselves.\n\n" +
        "The Earth is the only world known so far to harbor life. There is nowhere else, at least in the near future, to which our species could migrate. Visit, yes. Settle, not yet. Like it or not, for the moment the Earth is where we make our stand.\n\n" +

        "It has been said that astronomy is a humbling and character-building experience. There is perhaps no better demonstration of the folly of human conceits than this distant image of our tiny world. To me, it underscores our responsibility to deal more kindly with one another, and to preserve and cherish the pale blue dot, the only home we've ever known."
    );
    //Enabling the Re-build button
    let [enableButton, setEnableButton] = useState(false);
    //Text provided state
    let [textProvided, setTextProvided] = useState(true);
    //Dictionary generated state
    let {dictGenerated, setDictGenerated} = props;

    //When text is entered into the textarea
    const textRetrieval = (text) => {
        //Set input text
        setInputText(text.target.value)
        //Enable the Re-Build Dictionary Button
        setEnableButton(true);
    }
    
    //When the re-build dictionary button is clicked
    const rebuild_dict_clicked = () => {
        //Update nGram dictionary
        setNGramDict(build_dictionary(inputText, modelType));
        //Set enable button to false
        setEnableButton(false);
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
        if (!enableButton) {
            //Trigger dictionary generation
            setNGramDict(build_dictionary(inputText, modelType));
        }
    }, [modelType])

    //Generate Text when the dictionary is altered.
    useEffect(() => {
        setGeneratedText(generate_text(nGramDict, modelType, wordCount));
    }, [nGramDict, modelType, wordCount])

    //HTML
    return (
        <div className = "text-processing" class = "flex flex-col space-y-2 h-full w-full items-center justify-center rounded-md bg-zinc-50 drop-shadow-md" >
            <div className = "panel-1-header" class = "flex flex-row h-fit w-11/12 align-center items-center justify-center space-x-4">
                <p className = "text-entrance-text" class = "flex-auto monitor:text-lg 2xl:text-sm xl:text-sm sm:text-xs font-bold w-4/12">[1] Provide a Passage and Model.</p>
                <div className = "n-gram-selection" class = "flex-auto space-x-4 w-2/6 align-center justify-center">
                    <label class = "monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs">Select n-gram type:</label>
                    <select name = "n-gram-model-type" id = "n-gram-model-type" defaultValue = "bi-gram" onChange = {modelSelect} class = "h-fit w-5/12 monitor:text-base 2xl:text-sm xl:text-sm sm:text-xs rounded-md outline outline-slate-200 outline-3 focus:outline-none focus:ring text-center">
                        <option key = "bi-gram">Bi-gram</option>
                        <option key = "tri-gram">Tri-gram</option>
                        <option key = "tetra-gram">Tetra-gram</option>
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
            {textProvided ? (
                <div></div>
            ) : (
                <div className = "no-text-provided" class = "text-red-500 font-bold">Please provide a sample input passage with at least 2 words.</div>
            )}
        </div>
    )
}