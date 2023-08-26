import React, {createContext, useState, useContext} from 'react';

//Generate context
const DictContext = createContext();

//Hook for context access
export const useDictContext = () => useContext(DictContext);

//Context access wrapper
export const DictContextProvider = ({ children }) => {
    //Set Dictionary, Branching Factor, and Gram Count Variables
    const [nGramDict, setNGramDict] = useState({});
    const [branchingFactor, setBranchingFactor] = useState(0);
    const [lenDict, setLenDict] = useState(0);
    //Set model type
    const [modelType, setModelType] = useState("Bi-gram");
    //Set Text Generation Variables
    const [generatedText, setGeneratedText] = useState("");
    //Set word count
    const [wordCount, setWordCount] = useState(100);
    //Mode of text generation
    const [textGenMode, setTextGenMode] = useState("automatic");
    //Current word, key, and word options for manual text generation
    const [currentWord, setCurrentWord] = useState("")
    const [key, setKey] = useState("")
    const [wordOptions, setWordOptions] = useState([])

    // ======== ALL PREPROCESSING FUNCTIONS (REFACTORED INTO JSX FROM PYTHON) ========

    //Preprocess and tokenize words

    const get_words = (text_string) => {
        //Characters to be removed
        const remove_chars = ",:;()'\n\t"
        //Characters to replace with a space
        const spacer_chars = ".?!"
        //Resultant characters
        const result_chars = []
        //Iterate over each character in the text string
        for (var i = 0; i < text_string.length; i++) {
            //Get current character
            let current_char = text_string[i];
            //Check if it must be removed
            if (remove_chars.indexOf(current_char) > -1) {
                //Append a blank space to the resulting characters
                result_chars.push(' ');
            //Check if it is a spacer character (that we want to tokenize)
            } else if (spacer_chars.indexOf(current_char) > -1) {
                //Push surrounded by spaces (seperate token)
                result_chars.push(...[' ', current_char, ' ']);
            //If neither, simply append a lowercase version of the character
            } else {
                result_chars.push(current_char.toLowerCase());
            }
        }
        //Concatenate all characters into a single string and remove beginning and ending characters
        let result_string = result_chars.join("").trim();
        //Replace all double spaces with single spaces
        result_string = result_string.replace(/\s+/g, " ");
        //Split into individual words
        const words = result_string.split(" ");
        //Return words
        return words;
    }
    
    //Make bigram dictionary
    const make_bigram_dict = (text_string) => {
        //Get individual words from text string
        const words = get_words(text_string);
        //Blank bigram dictionary
        const bigram_dict = {};
        //Iterate over words
        for (var i = 0; i < words.length - 1; i++) {
            //Get key value pair
            const key = words[i];
            const value = words[i+1];
            //Check if the key is not in the dictionary
            if (Object.keys(bigram_dict).indexOf(key) === -1){
                //Append empty array
                bigram_dict[key] = [];
            }
            //Check if the value has not yet been added to the key
            if (bigram_dict[key].indexOf(value) === -1) {
                //Append
                bigram_dict[key].push(value);
            }
        }
        //Return dictionary
        return bigram_dict
    }

    //Make trigram dictionary
    const make_trigram_dict = (text_string) => {
        //Get individual words from text string
        const words = get_words(text_string);
        //Blank bigram dictionary
        const trigram_dict = {};
        //Iterate over words
        for (var i = 0; i < words.length - 2; i++) {
            //Get key value pair (keys consist of two words, value is thus two positions ahead)
            const key = words[i] + " " + words[i+1];
            const value = words[i+2];
            //Check if the key is not in the dictionary
            if (Object.keys(trigram_dict).indexOf(key) === -1) {
                //Append empty array
                trigram_dict[key] = [];
            }
            //Check if the value has not yet been added to the key
            if (trigram_dict[key].indexOf(value) === -1) {
                //Append
                trigram_dict[key].push(value);
            }
        }
        //Return dictionary
        return trigram_dict
    }

    //Make tetragram dictionary
    const make_tetragram_dict = (text_string) => {
        //Get individual words from text string
        const words = get_words(text_string);
        //Blank bigram dictionary
        const tetragram_dict = {};
        //Iterate over words
        for (var i = 0; i < words.length - 3; i++) {
            //Get key value pair (keys consist of three words, value is thus three positions ahead)
            const key = words[i] + " " + words[i+1] + " " + words[i+2];
            const value = words[i+3];
            //Check if the key is not in the dictionary
            if (Object.keys(tetragram_dict).indexOf(key) === -1){
                //Append empty array
                tetragram_dict[key] = [];
            }
            //Check if the value has not yet been added to the key
            if (tetragram_dict[key].indexOf(value) === -1) {
                //Append
                tetragram_dict[key].push(value);
            }
        }
        //Return dictionary
        return tetragram_dict
    }

    //Calculate branching factor
    const branching_factor = (dict) => {
        //Get lengths of each key
        const key_lengths = Object.keys(dict).map(function(key) {return dict[key].length;});
        //Sum and divide by number of keys
        return Math.round((key_lengths.reduce(function(a, b) {return a + b;}, 0) / Object.keys(dict).length + Number.EPSILON) * 1000) / 1000;
    }   

    //Generate bigram text
    const gen_bigram = (start = null, bigram_dict = null, word_count = wordCount) => {
        //Check if no starting point has been specified
        if (start === null) {
            //Get all keys
            const keys = Object.keys(bigram_dict);
            //Choose a random key to start
            start = keys[Math.floor(Math.random() * keys.length)];
        //Verify that the start key is in the dictionary
        } else if (Object.keys(bigram_dict).indexOf(start) === -1) {
            throw ReferenceError("'" + start + "'" + " not in bigram dictionary");
        }
        //Set first word, sentence, and generated word count tracker
        let word = start;
        let sentence = "";
        let count = 0;
        //Iterate while count < word_count and the word is in the dictionary
        while (word !== null && count < word_count) {
            //Concatenate sentence
            sentence = sentence.concat(" ", word);
            //Increment count
            count++;
            //Verify that the word is in the dictionary
            if (Object.keys(bigram_dict).indexOf(word) > -1) {
                //Choose new word based on values
                word = bigram_dict[word][Math.floor(Math.random() * bigram_dict[word].length)];
            //Set the word to null otherwise
            } else {word = null;}
        }
        //Remove leading and trailing spaces before returning
        return sentence.trim();
    }

    //Generate trigram text
    const gen_trigram = (start = null, trigram_dict = null, word_count = wordCount) => {
        //Check if no starting point has been specified
        if (start === null) {
            //Get all keys
            const keys = Object.keys(trigram_dict);
            //Choose a random key to start
            start = keys[Math.floor(Math.random() * keys.length)];
        //Verify that the start key is in the dictionary
        } else if (Object.keys(trigram_dict).indexOf(start) === -1) {
            throw ReferenceError("'" + start + "'" + " not in trigram dictionary");
        }
        //Set first word, sentence, and generated word count tracker
        let [word1, word2] = start.split(" ");
        let sentence = "";
        let count = 0;
        //Iterate while count < word_count and the word is in the dictionary
        while (word1 !== null && count < word_count) {
            //Concatenate sentence
            sentence = sentence.concat(" ", word1);
            //Increment count
            count++;
            //Generate key
            const key = word1 + " " + word2;
            //Verify that the key is in the dictionary
            if (Object.keys(trigram_dict).indexOf(key) > -1) {
                //Choose new words based on values
                word1 = word2
                word2 = trigram_dict[key][Math.floor(Math.random() * trigram_dict[key].length)];
            //Set the word to null otherwise
            } else {
                word1 = null;
                word2 = null;
            }
        }
        //Remove leading and trailing spaces before returning
        return sentence.trim();
    }

    //Generate tetragram text
    const gen_tetragram = (start = null, tetragram_dict = null, word_count = wordCount) => {
        //Check if no starting point has been specified
        if (start === null) {
            //Get all keys
            const keys = Object.keys(tetragram_dict);
            //Choose a random key to start
            start = keys[Math.floor(Math.random() * keys.length)];
        //Verify that the start key is in the dictionary
        } else if (Object.keys(tetragram_dict).indexOf(start) === -1) {
            throw ReferenceError("'" + start + "'" + " not in tetragram dictionary");
        }
        //Set first word, sentence, and generated word count tracker
        let [word1, word2, word3] = start.split(" ");
        let sentence = "";
        let count = 0;
        //Iterate while count < word_count and the word is in the dictionary
        while (word1 !== null && count < word_count) {
            //Concatenate sentence
            sentence = sentence.concat(" ", word1);
            //Increment count
            count++;
            //Generate key
            const key = word1 + " " + word2 + " " + word3;
            //Verify that the key is in the dictionary
            if (Object.keys(tetragram_dict).indexOf(key) > -1) {
                //Choose new words based on values
                word1 = word2;
                word2 = word3;
                word3 = tetragram_dict[key][Math.floor(Math.random() * tetragram_dict[key].length)];
            //Set the word to null otherwise
            } else {
                word1 = null;
                word2 = null;
                word3 = null;
            }
        }
        //Remove leading and trailing spaces before returning
        return sentence.trim();
    }

    //Build model dictionary
    const build_dictionary = (input_text, model_type) => {
        //Build dictionary according to model type
        let gen_dict = {};
        if (model_type === "Bi-gram") {gen_dict = make_bigram_dict(input_text);}
        else if (model_type === "Tri-gram") {gen_dict = make_trigram_dict(input_text);}
        else if (model_type === "Tetra-gram") {gen_dict = make_tetragram_dict(input_text);}
        //Raise an error if model type is invalid
        else {throw ReferenceError("Invalid model type supplied to buildDictionary (expected 'Bi-gram', 'Tri-gram', or 'Tetra-gram').")}
        //Sort alphabetically via array conversion
        const gen_arr = Object.entries(gen_dict);
        gen_arr.sort((a, b) => a[0].localeCompare(b[0]))
        const sorted = Object.fromEntries(gen_arr);
        //Return dictionary
        return sorted;
    }

    //Generate Text Function. This will be called both autonomously (when building dictionaries and changing models) as well as when the button is clicked.
    //When the generate button is clicked, perform a get request and retrieve the generated text.
    const generate_text = (gen_dict, model_type, word_count) => {
        //Identify model type and generate text accordingly
        let gen_text = "";
        if (model_type === "Bi-gram") {gen_text = gen_bigram(null, gen_dict, word_count);}
        else if (model_type === "Tri-gram") {gen_text = gen_trigram(null, gen_dict, word_count);}
        else if (model_type === "Tetra-gram") {gen_text = gen_tetragram(null, gen_dict, word_count);}
        //Raise error for invalid model type
        else {throw ReferenceError("Invalid model type supplied to generateText (expected 'Bi-gram', 'Tri-gram', or 'Tetra-gram').")}
        //Return text
        return gen_text;
    }

    return (
        <DictContext.Provider 
        value = {{
            //Variables
            nGramDict, 
            setNGramDict,
            branchingFactor,
            setBranchingFactor,
            lenDict,
            setLenDict,
            modelType,
            setModelType,
            generatedText,
            setGeneratedText,
            wordCount,
            setWordCount,
            textGenMode,
            setTextGenMode,
            currentWord,
            setCurrentWord,
            key,
            setKey,
            wordOptions,
            setWordOptions,
            //Functions
            get_words,
            make_bigram_dict,
            make_trigram_dict,
            make_tetragram_dict,
            branching_factor,
            gen_bigram,
            gen_trigram,
            gen_tetragram,
            build_dictionary,
            generate_text}}>
            {children}
        </DictContext.Provider>
    )
}