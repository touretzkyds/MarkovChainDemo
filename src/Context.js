import { all } from 'axios';
import React, {createContext, useState, useEffect, useContext} from 'react';
import inputStr from './inputText';

//Generate context
const DictContext = createContext();

//Hook for context access
export const useDictContext = () => useContext(DictContext);

//Context access wrapper
export const DictContextProvider = ({ children }) => {

    //Define input text
    let [inputText, setInputText] = useState(inputStr);

    //Set Map, Branching Factor, and Gram Count Variables
    const [nGramDict, setNGramDict] = useState(new Map());
    const [branchingFactor, setBranchingFactor] = useState(0);
    const [lenDict, setLenDict] = useState(0);

    //Enabling the Re-build dictionary button
    let [enableButton, setEnableButton] = useState(false);
    //To verify that panes 3 and 4 have been cleared before building a given dictionary
    const [panesCleared, setPanesCleared] = useState(true);

    //Set model type
    const [modelType, setModelType] = useState("Bi-gram");
    //Variable to detect if a dictionary element (forcing a render of pane four) has been clicked
    const [pane2KeyClicked, setPane2KeyClicked] = useState(false);
    //Variable to set whether pane four should generate text based on a manually-generated start key
    const [manualStartKey, setManualStartKey] = useState(false);
    //Variable to dynamically set the startKey
    const [globalStartKey, setGlobalStartKey] = useState("");

    //To store frequency of words in the dictionary
    const [frequencies, setFrequencies] = useState({});

    //Set Text Generation Variables
    const [generatedText, setGeneratedText] = useState("");
    const [manualGeneratedText, setManualGeneratedText] = useState("");

    //Set word count
    const [wordCount, setWordCount] = useState(100);
    //Set token count (length of words dictionary)
    const [tokenCount, setTokenCount] = useState(0);

    //Mode of text generation
    const [textGenMode, setTextGenMode] = useState("automatic");
    //If text has been visualized
    const [textVisualized, setTextVisualized] = useState(false);

    //For automatic visualizations
    const [autoGraphAllowed, setAutoGraphAllowed] = useState(true);
    //Current word, key, and word options for manual text generation
    const [currentWord, setCurrentWord] = useState("")

    //To keep track of the position of the current word
    const [currentWordCounter, setCurrentWordCounter] = useState(0);
    const [key, setKey] = useState("")
    const [wordOptions, setWordOptions] = useState([])

    //Keep track of nodes that have been added to the manual visualization graph (all selected)
    //Declare a state variable to house the graph and keep track of all added nodes
    const [graphData, setGraphData] = useState([]);
    const [keysAdded, setKeysAdded] = useState([]);
    const [enableNextWord, setEnableNextWord] = useState(false);
    const [clearButtonClicked, setClearButtonClicked] = useState(false);

    // ======== HELPER FUNCTIONS ========

    //A function to quickly and efficiently format displayed text
    const reFormatText = (input) => {
        const reFormattedText = input.replace(/[.!?]/g, word => {
            switch (word) {
                case ".": return "<PERIOD>";
                case "!": return "<EXCL>";
                case "?": return "<Q>";
                default: return word;
            }
        }).trim()
        return reFormattedText;
    }

    //A function to reverse the formatting of the display text when needed
    const unFormatText = (input) => {
        const unFormattedText = input.replace(/<[^>]+>/g, word => {
            switch (word) {
                case "<PERIOD>": return ".";
                case "<EXCL>": return "!";
                case "<Q>": return "?";
                default: return word;
            }
        }).trim()
        return unFormattedText;
    }

    // ======== ALL PREPROCESSING FUNCTIONS (REFACTORED INTO JSX FROM PYTHON) ========

    //Preprocess and tokenize words

    const get_words = (text_string) => {

        //Characters to be removed
        const remove_chars = "—,:;()\"*^→{}[]+=\n\t"

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
                //Push surrounded by spaces (separate token) while reFormatting
                result_chars.push(...[' ', reFormatText(current_char), ' ']);
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
        //Set token count
        setTokenCount(words.length);
        //Return words
        return words;
    }
    
    //Make bigram dictionary
    const make_bigram_dict = (text_string) => {
        //Get individual words from text string
        const words = get_words(text_string);
        //Combine words into filtered text
        //Blank bigram map
        const bigram_map = new Map();
        //Iterate over words
        for (let i = 0; i < words.length - 1; i++) {

            //Get key value pair
            const key = words[i];
            const value = words[i+1];

            //Check if the key is not in the dictionary
            if (!bigram_map.has(key)){
                //Add empty Map object
                bigram_map.set(key, new Map());
            }

            const value_map = bigram_map.get(key);
            //Check if the value has not yet been added to the key
            if (!value_map.has(value)) {
                value_map.set(value, 0)
            }

            value_map.set(value, value_map.get(value) + 1)
        }

        //Replace all frequency measurements with probabilities
        //Iterate again over words
        for (let i = 0; i < words.length - 1; i ++) {
            
            let key = words[i];
            let values = Array.from(bigram_map.get(key));

            //Get all frequencies, sum, and normalize.
            let allFrequencies = [];
            for (let i = 0; i < values.length; i++) {allFrequencies.push(values[i][1]);}
            const freqSum = allFrequencies.reduce((incompleteSum, f) => incompleteSum + f, 0);
            
            //Normalize
            const normFactor = 1.0/freqSum;
            for (let i = 0; i < allFrequencies.length; i++) {allFrequencies[i] = allFrequencies[i] * normFactor;}

            //Replace frequencies with probabilities
            let value_map = bigram_map.get(key);
            let j = 0;

            for (let [valueKey, valueProb] of value_map) {
                //Round to two decimal places
                let roundedVal = parseFloat(allFrequencies[j].toFixed(2));

                value_map.set(valueKey, roundedVal);
                j++;
            }
            
        }
        return bigram_map
    }

    //Make trigram dictionary
    const make_trigram_dict = (text_string) => {

        //Get individual words from text string
        const words = get_words(text_string);

        //Blank bigram map
        const trigram_map = new Map();

        //Iterate over words
        for (var i = 0; i < words.length - 2; i++) {
            
            //Get key value pair (keys consist of two words, value is thus two positions ahead)
            const key = words[i] + " " + words[i+1];
            const value = words[i+2];

            //Check if the key is not in the dictionary
            if (!trigram_map.has(key)) {
                //Append empty array
                trigram_map.set(key, new Map());
            }

            //Get all values
            const value_map = trigram_map.get(key);

            //Check if the value has not yet been added to the key
            if (!value_map.has(value)) {
                //Set
                value_map.set(value, 0);
            }

            //Set value
            value_map.set(value, value_map.get(value) + 1);
        }

                //Replace all frequency measurements with probabilities
        //Iterate again over words
        for (let i = 0; i < words.length - 2; i ++) {
            
            let key = words[i] + " " + words[i + 1];
            let values = Array.from(trigram_map.get(key));

            //Get all frequencies, sum, and normalize.
            let allFrequencies = [];
            for (let i = 0; i < values.length; i++) {allFrequencies.push(values[i][1]);}
            const freqSum = allFrequencies.reduce((incompleteSum, f) => incompleteSum + f, 0);
            
            //Normalize
            const normFactor = 1.0/freqSum;
            for (let i = 0; i < allFrequencies.length; i++) {allFrequencies[i] = allFrequencies[i] * normFactor;}

            //Replace frequencies with probabilities
            let value_map = trigram_map.get(key);
            let j = 0;

            for (let [valueKey, valueProb] of value_map) {
                value_map.set(valueKey, parseFloat(allFrequencies[j].toFixed(2)));
                j++;
            }
            
        }

        //Return dictionary
        return trigram_map
    }

    //Make tetragram dictionary
    const make_tetragram_dict = (text_string) => {

        //Get individual words from text string
        const words = get_words(text_string);

        //Blank tetragram map
        const tetragram_map = new Map();

        //Iterate over words
        for (let i = 0; i < words.length - 3; i++) {

            //Get key value pair (keys consist of three words, value is thus three positions ahead)
            const key = words[i] + " " + words[i+1] + " " + words[i+2];
            const value = words[i+3];

            //Check if the key is not in the dictionary
            if (!tetragram_map.has(key)){
                //Append empty array
                tetragram_map.set(key, new Map());
            }

            const value_map = tetragram_map.get(key);
            //Check if the value has not yet been added to the key
            if (!value_map.has(value)) {
                //Add empty map
                value_map.set(value, 0);
            }

            //Set frequency
            value_map.set(value, value_map.get(value) + 1);
        }

        for (let i = 0; i < words.length - 3; i ++) {
            
            let key = words[i] + " " + words[i+1] + " " + words[i+2];
            let values = Array.from(tetragram_map.get(key));

            //Get all frequencies, sum, and normalize.
            let allFrequencies = [];
            for (let i = 0; i < values.length; i++) {allFrequencies.push(values[i][1]);}
            const freqSum = allFrequencies.reduce((incompleteSum, f) => incompleteSum + f, 0);
            
            //Normalize
            const normFactor = 1.0/freqSum;
            for (let i = 0; i < allFrequencies.length; i++) {allFrequencies[i] = allFrequencies[i] * normFactor;}

            //Replace frequencies with probabilities
            let value_map = tetragram_map.get(key);
            let j = 0;

            for (let [valueKey, valueProb] of value_map) {
                value_map.set(valueKey, parseFloat(allFrequencies[j].toFixed(2)));
                j++;
            }
            
        }

        //Return dictionary
        return tetragram_map

    }

    //Calculate branching factor
    const branching_factor = (map) => {
        //Get lengths of each key
        var map_arr = Array.from(map);
        const key_lengths = map_arr.map(function(key) {return key[1].size;});

        //Sum and divide by the total number of keys - account for if the length of the keys is zero
        return key_lengths !== 0 ? Math.round((key_lengths.reduce(function(a, b) {return a + b;}, 0) / (map_arr.length + Number.EPSILON)) * 1000) / 1000 : 0;
    }

    //Select a word based on the frequency said word occurs in within the given text
    const select_word_probabilistically = (gram_map, word) => {

        //Store all values
        if (gram_map.get(word) === undefined) {return null;}
        const values = Array.from(gram_map.get(word));

        //Get all frequencies
        const optFrequencies = [];
        for (let i = 0; i < values.length; i++) {optFrequencies.push(values[i][1]);}

        //Sum and normalize all frequencies
        const freqSum = optFrequencies.reduce((incompleteSum, f) => incompleteSum + f, 0);
        //Normalize
        const normFactor = 1.0/freqSum;
        for (let i = 0; i < optFrequencies.length; i++) {optFrequencies[i] = optFrequencies[i] * normFactor;}

        //Choose new word based on probabilities
        //Randomly generate value between 0 and 1
        const randomNum = Math.random();
        //This random number will be compared to each wordOption's probabilities
        let probSum = 0;

        //Iterate over all probabilities
        for (let i = 0; i < optFrequencies.length; i++) {

            //Add the current probability to the probSum
            probSum += optFrequencies[i];

            //If the randomly generated number is in the appropriate range, assign the associated option to the current word
            if (randomNum < probSum) {
                return values[i][0];
            }

        }

        //If the function has not already returned (i.e. the word has not been assigned a new value), we are in the probability range of the final word
        //Return the final word in the array
        return values[values.length - 1][0];
    }

    //Generate bigram text
    const gen_bigram = (start = null, bigram_map = null, word_count = wordCount) => {
        
        let bigram_arr = Array.from(bigram_map);
        //Get all keys
        const keys = bigram_arr.map(function (pair) {return pair[0];});
        
        //Check if no starting point has been specified
        if (start === null || start === "") {
            //Choose a random key to start
            start = keys[Math.floor(Math.random() * keys.length)];
        
        //Verify that the start key is in the dictionary
        } else if (keys.indexOf(start) === -1) {
            throw ReferenceError(`'${start}' not in bigram dictionary.`);
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
            if (Array.from(keys.indexOf(word)) > -1) {

                //Select new word based on frequency
                word = select_word_probabilistically(bigram_map, word);
            
                //Set the word to null otherwise
            } else {word = null;}

        }
        //Remove leading and trailing spaces before returning
        return sentence.trim();
    }

    //Generate trigram text
    const gen_trigram = (start = null, trigram_map = null, word_count = wordCount) => {
        
        let trigram_arr = Array.from(trigram_map);
        //Get all the keys
        const keys = trigram_arr.map(function (pair) {return pair[0];});

        //Check if no starting point has been specified
        if (start === null) {

            //Choose a random key to start
            start = keys[Math.floor(Math.random() * keys.length)];

        //Verify that the start key is in the dictionary
        } else if (keys.indexOf(start) === -1) {
            throw ReferenceError(`'${start}' not in trigram dictionary.`);
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
            if (Array.from(keys.indexOf(key)) > -1) {

                //Choose new words based on values
                word1 = word2

                //The final word will also take probability of occurrence into account
                word2 = select_word_probabilistically(trigram_map, key);

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
    const gen_tetragram = (start = null, tetragram_map = null, word_count = wordCount) => {
        
        //Convert map to array; store keys in separate array
        let tetragram_arr = Array.from(tetragram_map);
        const keys = tetragram_arr.map(function (pair) {return pair[0];});
        
        //Check if no starting point has been specified
        if (start === null) {
            //Choose a random key to start
            start = keys[Math.floor(Math.random() * keys.length)];
        
        //Verify that the start key is in the dictionary
        } else if (keys.indexOf(start) === -1) {
            throw ReferenceError(`'${start}' not in tetragram dictionary.`);
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
            if (Array.from(keys.indexOf(key)) > -1) {

                //Choose new words based on values
                word1 = word2;
                word2 = word3;

                //Select third word based on frequency of occurrence for given options
                word3 = select_word_probabilistically(tetragram_map, key);

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

    //Build model map
    const build_dictionary = (input_text, model_type) => {

        //Build map according to model type
        let gen_map = new Map();

        if (model_type === "Bi-gram") {gen_map = make_bigram_dict(input_text);}
        else if (model_type === "Tri-gram") {gen_map = make_trigram_dict(input_text);}
        else if (model_type === "Tetra-gram") {gen_map = make_tetragram_dict(input_text);}
        
        //Raise an error if model type is invalid
        else {throw ReferenceError("Invalid model type supplied to build_map (expected 'Bi-gram', 'Tri-gram', or 'Tetra-gram').")}
        
        //Sort by all alphabetical characters - non-alpha characters should be placed at the end of the dictionary.

        //Helper function to compare words while keeping non-alpha words at the end
        function compareWords(a, b) {
            const isAlphaA = /[a-zA-Z]/.test(a); // Test if a is alphabetical
            const isAlphaB = /[a-zA-Z]/.test(b); // Test if b is alphabetical
        
            if (isAlphaA && isAlphaB) {
            return a.localeCompare(b); // Compare alphabetical words alphabetically
            } else if (isAlphaA) {
            return -1; // Place alphabetical words before non-alphabetical words
            } else if (isAlphaB) {
            return 1; // Place non-alphabetical words after alphabetical words
            } else {
            return a.localeCompare(b); // Compare non-alphabetical words alphabetically
            }
        }
        
        //Sort the submaps within each map
        for (const [key, subDict] of gen_map) {
            const sortedSubKeys = [...subDict.keys()].sort(compareWords);
            const sortedSubDict = new Map();
            sortedSubKeys.forEach(subKey => {
              sortedSubDict.set(subKey, subDict.get(subKey));
            });
            gen_map.set(key, sortedSubDict);
        }

        //Sort keys in the same way.
        //Convert the object to an array of key-value pairs
        //Sort alphabetically via array conversion
        const gen_arr = Array.from(gen_map);

        //Sort the array
        gen_arr.sort(([keyA], [keyB]) => {
            //Assign a sorting value for alphabet characters and symbols
            const valueA = keyA[0].match(/[a-zA-Z]/) ? 0 : 1;
            const valueB = keyB[0].match(/[a-zA-Z]/) ? 0 : 1;
        
            //If both are of the same type (alphabet or symbol), compare them
            if (valueA === valueB) {
                return keyA.localeCompare(keyB);
            }
        
            //Alphabet characters come before symbols
            return valueA - valueB;
        });
        
        //Convert the sorted array back to a Map
        const sorted = new Map(gen_arr);

        //Return Map
        return sorted;
    }

    //Generate Text Function. This will be called both autonomously (when building dictionaries and changing models) as well as when the button is clicked.
    //When the generate button is clicked, perform a get request and retrieve the generated text.
    const generate_text = (start, gen_map, model_type, word_count) => {
        //Identify model type and generate text accordingly
        let gen_text = "";
        if (model_type === "Bi-gram") {gen_text = gen_bigram(start, gen_map, word_count);}
        else if (model_type === "Tri-gram") {gen_text = gen_trigram(start, gen_map, word_count);}
        else if (model_type === "Tetra-gram") {gen_text = gen_tetragram(start, gen_map, word_count);}
        //Raise error for invalid model type
        else {throw ReferenceError("Invalid model type supplied to generateText (expected 'Bi-gram', 'Tri-gram', or 'Tetra-gram').")}
        //Return text
        return gen_text;
    }

    return (
        <DictContext.Provider 
        value = {{
            //Variables
            inputText,
            setInputText,
            enableButton,
            setEnableButton,
            nGramDict, 
            setNGramDict,
            branchingFactor,
            setBranchingFactor,
            lenDict,
            setLenDict,
            modelType,
            setModelType,
            panesCleared,
            setPanesCleared,
            pane2KeyClicked,
            setPane2KeyClicked,
            manualStartKey,
            setManualStartKey,
            globalStartKey,
            setGlobalStartKey,
            frequencies,
            setFrequencies,
            generatedText,
            setGeneratedText,
            manualGeneratedText,
            setManualGeneratedText,
            wordCount,
            setWordCount,
            tokenCount,
            setTokenCount,
            textGenMode,
            setTextGenMode,
            textVisualized,
            setTextVisualized,
            autoGraphAllowed,
            setAutoGraphAllowed,
            currentWord,
            setCurrentWord,
            currentWordCounter,
            setCurrentWordCounter,
            key,
            setKey,
            wordOptions,
            setWordOptions,
            graphData,
            setGraphData,
            keysAdded,
            setKeysAdded,
            enableNextWord,
            setEnableNextWord,
            clearButtonClicked,
            setClearButtonClicked,
            //Helper Functions
            reFormatText,
            unFormatText,
            //Markov Chain Implementation Functions
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