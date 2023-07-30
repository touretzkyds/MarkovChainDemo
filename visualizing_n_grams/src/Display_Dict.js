import React from "react";
import axios from "axios";
axios.defaults.baseURL = "http://localhost:3001"

function DisplayDict(props) {
    const {dict, branching_factor, num_entries} = props;

    return (
        <div className = "dict_stat_display" class = "flex flex-col w-full h-full items-center align-center text-center justify-center bg-slate-500">
            <div className = "gen-dict-label" class = "text"><strong>Your dictionary has been generated.</strong></div>
            <div className = "stat_display" class = "text-red-500"><strong>Branching Factor: </strong>{branching_factor} <strong>Number of Entries: </strong>{num_entries}</div>
            <p></p>
            <div className = "dict_display" class = "flex flex-wrap w-full h-1/12 flex flex-wrap space-x-2 overflow-y-auto">
                {Object.entries(dict).map(([key, value]) => (
                    <div key = {key}>
                        <strong>'{key}': </strong> 
                        {value.map((item, index) => (
                            <li style = {{listStyle : 'none'}}>{item},</li>
                        ))}
                    </div>
                ))}

                
            </div>

        </div>
    )
}

export default DisplayDict