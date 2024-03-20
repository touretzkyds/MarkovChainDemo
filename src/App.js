import './App.css';
import React, {useState} from "react";
import GenerateDict from './Generate_Dict';
import GeneratePassage from './Generate_Passage';

import DisplayDict from './Display_Dict';
import Visualizations from './Visualizations';
import { DictContextProvider } from './Context';
import "./homepage.css"
//From opening new webpages 

export default function App() {
  
  //Check whether the dictionary has been generated
  let [dictGenerated, setDictGenerated] = useState(false);

  //The About window when the respective button is clicked

  const openAboutWindow = () => {
    //Build a new URL (adding about.html to the current path) and convert it to a string
    const aboutPath = new URL('about.html', window.location.href).toString();
    //Open the built path
    window.open(aboutPath, '_blank');
  };

  return (
    <DictContextProvider>
      <div className = "application-frame" class = "h-screen w-screen flex flex-col items-center justify-center py-5" >
        <div className = "application" class = "flex flex-col h-full w-11/12 text-left divide-y divide-solid">
          <div className = "header-obj" class = "custom-header">
            <div className = "header-text-col" class = "flex flex-col w-full">
              <div className = "heading" class = "flex flex-row w-full h-full space-x-5">
                <div className = "header-text" class = "text-2xl font-bold">Markov Chain Demo</div>
                <button className = "about-button" onClick = {openAboutWindow} class = "bg-white text-black font-bold hover:bg-black hover:text-white hover:ring rounded-md w-1/12 h-full outline outline-1">About / Help</button>
              </div>
              
              <div className = "subheader-text">A tool to explore and tinker with n-grams - a statistical precursor to Large Language Models (LLMs).</div>
            </div> 
          </div>
          <div className = "application-body" class = "custom-application-body">
              <GenerateDict dictGenerated = {dictGenerated} setDictGenerated = {setDictGenerated}/>
              <DisplayDict/>
              <GeneratePassage/>
              <Visualizations/>
          </div>
        </div>
      </div>
    </DictContextProvider>
  );
}