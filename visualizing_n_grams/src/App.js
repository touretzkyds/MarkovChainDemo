import './App.css';
import React, {useState, useEffect} from "react";
import GenerateDict from './Generate_Dict';
import GeneratePassage from './Generate_Passage';
import {v4 as uuidv4} from 'uuid';

export default function App() {
  //Declare user id
  const gen_id = uuidv4();
  const [userID, setUserID] = useState(gen_id);
  
  //Check whether the dictionary has been generated
  let [dictGenerated, setDictGenerated] = useState(false);
  console.log(dictGenerated);
  return (
    <div className = "application-frame" class = "h-screen w-screen flex flex-col items-center justify-center py-8" >
      <div className = "application" class = "flex flex-col h-full w-11/12 text-left divide-y divide-solid">
        <div className = "header-obj" class = "flex flex-col h-fit pb-3">
          <div className = "header-text" class = "text-2xl font-bold">A Tool For Understanding and Visualizing N-Grams.</div>
          <div className = "subheader-text" class = "">An interactive tool to learn and visualize how n-gram models - a useful technique for statistical natural language processing - operate.</div>
        </div>
        <GenerateDict userID = {userID} setDictGenerated = {setDictGenerated}/>
        {dictGenerated ? (<GeneratePassage userID = {userID}/>) : <div></div>}
      </div>
    </div>
  );
}