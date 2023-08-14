import React, {useState, useEffect} from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
import { useDictContext } from "./Context";

export default function GenerateDict(props){
    //Get dictionary, branching factor, and number of bigrams from context manager
    const {nGramDict, setNGramDict, modelType, setModelType, setGeneratedText, wordCount, build_dictionary, generate_text} = useDictContext();
    //Input text - The Wizard of Oz, https://www.gutenberg.org/cache/epub/55/pg55-images.html
    let [inputText, setInputText] = useState(

        "Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer’s wife. Their house was small, for the lumber to build it had to be carried by wagon many miles. There were four walls, a floor and a roof, which made one room; and this room contained a rusty looking cookstove, a cupboard for the dishes, a table, three or four chairs, and the beds. Uncle Henry and Aunt Em had a big bed in one corner, and Dorothy a little bed in another corner. There was no garret at all, and no cellar—except a small hole dug in the ground, called a cyclone cellar, where the family could go in case one of those great whirlwinds arose, mighty enough to crush any building in its path. It was reached by a trap door in the middle of the floor, from which a ladder led down into the small, dark hole.\n\n"+

        "When Dorothy stood in the doorway and looked around, she could see nothing but the great gray prairie on every side. Not a tree nor a house broke the broad sweep of flat country that reached to the edge of the sky in all directions. The sun had baked the plowed land into a gray mass, with little cracks running through it. Even the grass was not green, for the sun had burned the tops of the long blades until they were the same gray color to be seen everywhere. Once the house had been painted, but the sun blistered the paint and the rains washed it away, and now the house was as dull and gray as everything else.\n\n"+

        "When Aunt Em came there to live she was a young, pretty wife. The sun and wind had changed her, too. They had taken the sparkle from her eyes and left them a sober gray; they had taken the red from her cheeks and lips, and they were gray also. She was thin and gaunt, and never smiled now. When Dorothy, who was an orphan, first came to her, Aunt Em had been so startled by the child’s laughter that she would scream and press her hand upon her heart whenever Dorothy’s merry voice reached her ears; and she still looked at the little girl with wonder that she could find anything to laugh at.\n\n"+

        "Uncle Henry never laughed. He worked hard from morning till night and did not know what joy was. He was gray also, from his long beard to his rough boots, and he looked stern and solemn, and rarely spoke.\n\n"+

        "It was Toto that made Dorothy laugh, and saved her from growing as gray as her other surroundings. Toto was not gray; he was a little black dog, with long silky hair and small black eyes that twinkled merrily on either side of his funny, wee nose. Toto played all day long, and Dorothy played with him, and loved him dearly.\n\n"+

        "Today, however, they were not playing. Uncle Henry sat upon the doorstep and looked anxiously at the sky, which was even grayer than usual. Dorothy stood in the door with Toto in her arms, and looked at the sky too. Aunt Em was washing the dishes.\n\n"+

        "From the far north they heard a low wail of the wind, and Uncle Henry and Dorothy could see where the long grass bowed in waves before the coming storm. There now came a sharp whistling in the air from the south, and as they turned their eyes that way they saw ripples in the grass coming from that direction also.\n\n"+

        "Suddenly Uncle Henry stood up.\n\n"+

        "There’s a cyclone coming, Em, he called to his wife. I’ll go look after the stock. Then he ran toward the sheds where the cows and horses were kept.\n\n"+

        "Aunt Em dropped her work and came to the door. One glance told her of the danger close at hand.\n\n"+

        "Quick, Dorothy! she screamed. Run for the cellar!\n\n"+

        "Toto jumped out of Dorothy’s arms and hid under the bed, and the girl started to get him. Aunt Em, badly frightened, threw open the trap door in the floor and climbed down the ladder into the small, dark hole. Dorothy caught Toto at last and started to follow her aunt. When she was halfway across the room there came a great shriek from the wind, and the house shook so hard that she lost her footing and sat down suddenly upon the floor.\n\n"+

        "Then a strange thing happened.\n\n"+

        "The house whirled around two or three times and rose slowly through the air. Dorothy felt as if she were going up in a balloon.\n\n"+

        "The north and south winds met where the house stood, and made it the exact center of the cyclone. In the middle of a cyclone the air is generally still, but the great pressure of the wind on every side of the house raised it up higher and higher, until it was at the very top of the cyclone; and there it remained and was carried miles and miles away as easily as you could carry a feather.\n\n"+

        "It was very dark, and the wind howled horribly around her, but Dorothy found she was riding quite easily. After the first few whirls around, and one other time when the house tipped badly, she felt as if she were being rocked gently, like a baby in a cradle.\n\n"+

        "Toto did not like it. He ran about the room, now here, now there, barking loudly; but Dorothy sat quite still on the floor and waited to see what would happen.\n\n"+

        "Once Toto got too near the open trap door, and fell in; and at first the little girl thought she had lost him. But soon she saw one of his ears sticking up through the hole, for the strong pressure of the air was keeping him up so that he could not fall. She crept to the hole, caught Toto by the ear, and dragged him into the room again, afterward closing the trap door so that no more accidents could happen.\n\n"+

        "Hour after hour passed away, and slowly Dorothy got over her fright; but she felt quite lonely, and the wind shrieked so loudly all about her that she nearly became deaf. At first she had wondered if she would be dashed to pieces when the house fell again; but as the hours passed and nothing terrible happened, she stopped worrying and resolved to wait calmly and see what the future would bring. At last she crawled over the swaying floor to her bed, and lay down upon it; and Toto followed and lay down beside her.\n\n"+

        "In spite of the swaying of the house and the wailing of the wind, Dorothy soon closed her eyes and fell fast asleep.\n\n"+

        "She was awakened by a shock, so sudden and severe that if Dorothy had not been lying on the soft bed she might have been hurt. As it was, the jar made her catch her breath and wonder what had happened; and Toto put his cold little nose into her face and whined dismally. Dorothy sat up and noticed that the house was not moving; nor was it dark, for the bright sunshine came in at the window, flooding the little room. She sprang from her bed and with Toto at her heels ran and opened the door.\n\n"+

        "The little girl gave a cry of amazement and looked about her, her eyes growing bigger and bigger at the wonderful sights she saw.\n\n"+

        "The cyclone had set the house down very gently—for a cyclone—in the midst of a country of marvelous beauty. There were lovely patches of greensward all about, with stately trees bearing rich and luscious fruits. Banks of gorgeous flowers were on every hand, and birds with rare and brilliant plumage sang and fluttered in the trees and bushes. A little way off was a small brook, rushing and sparkling along between green banks, and murmuring in a voice very grateful to a little girl who had lived so long on the dry, gray prairies.\n\n"+

        "While she stood looking eagerly at the strange and beautiful sights, she noticed coming toward her a group of the queerest people she had ever seen. They were not as big as the grown folk she had always been used to; but neither were they very small. In fact, they seemed about as tall as Dorothy, who was a well-grown child for her age, although they were, so far as looks go, many years older.\n\n"+

        "Three were men and one a woman, and all were oddly dressed. They wore round hats that rose to a small point a foot above their heads, with little bells around the brims that tinkled sweetly as they moved. The hats of the men were blue; the little woman’s hat was white, and she wore a white gown that hung in pleats from her shoulders. Over it were sprinkled little stars that glistened in the sun like diamonds. The men were dressed in blue, of the same shade as their hats, and wore well-polished boots with a deep roll of blue at the tops. The men, Dorothy thought, were about as old as Uncle Henry, for two of them had beards. But the little woman was doubtless much older. Her face was covered with wrinkles, her hair was nearly white, and she walked rather stiffly.\n\n"+

        "When these people drew near the house where Dorothy was standing in the doorway, they paused and whispered among themselves, as if afraid to come farther. But the little old woman walked up to Dorothy, made a low bow and said, in a sweet voice:\n\n"+

        "You are welcome, most noble Sorceress, to the land of the Munchkins. We are so grateful to you for having killed the Wicked Witch of the East, and for setting our people free from bondage.\n\n"+

        "Dorothy listened to this speech with wonder. What could the little woman possibly mean by calling her a sorceress, and saying she had killed the Wicked Witch of the East? Dorothy was an innocent, harmless little girl, who had been carried by a cyclone many miles from home; and she had never killed anything in all her life.\n\n"+

        "But the little woman evidently expected her to answer; so Dorothy said, with hesitation, You are very kind, but there must be some mistake. I have not killed anything.\n\n"+

        "Your house did, anyway, replied the little old woman, with a laugh, and that is the same thing. See! she continued, pointing to the corner of the house. There are her two feet, still sticking out from under a block of wood.\n\n"

        // "Dorothy looked, and gave a little cry of fright. There, indeed, just under the corner of the great beam the house rested on, two feet were sticking out, shod in silver shoes with pointed toes.\n\n"+

        // "Oh, dear! Oh, dear! cried Dorothy, clasping her hands together in dismay. The house must have fallen on her. Whatever shall we do?\n\n"+

        // "There is nothing to be done, said the little woman calmly.\n\n"+

        // "But who was she? asked Dorothy.\n\n"+

        // "She was the Wicked Witch of the East, as I said, answered the little woman. She has held all the Munchkins in bondage for many years, making them slave for her night and day. Now they are all set free, and are grateful to you for the favor.\n\n"+

        // "Who are the Munchkins? inquired Dorothy.\n\n"+

        // "They are the people who live in this land of the East where the Wicked Witch ruled.\n\n"+

        // "Are you a Munchkin? asked Dorothy.\n\n"+

        // "No, but I am their friend, although I live in the land of the North. When they saw the Witch of the East was dead the Munchkins sent a swift messenger to me, and I came at once. I am the Witch of the North.\n\n"+

        // "Oh, gracious! cried Dorothy. Are you a real witch?\n\n"+

        // "Yes, indeed, answered the little woman. But I am a good witch, and the people love me. I am not as powerful as the Wicked Witch was who ruled here, or I should have set the people free myself.\n\n"

        // "But I thought all witches were wicked, said the girl, who was half frightened at facing a real witch. Oh, no, that is a great mistake. There were only four witches in all the Land of Oz, and two of them, those who live in the North and the South, are good witches. I know this is true, for I am one of them myself, and cannot be mistaken. Those who dwelt in the East and the West were, indeed, wicked witches; but now that you have killed one of them, there is but one Wicked Witch in all the Land of Oz—the one who lives in the West.\n\n"+

        // "But, said Dorothy, after a moment’s thought, Aunt Em has told me that the witches were all dead—years and years ago.\n\n"+

        // "Who is Aunt Em? inquired the little old woman.\n\n"+

        // "She is my aunt who lives in Kansas, where I came from.\n\n"+

        // "The Witch of the North seemed to think for a time, with her head bowed and her eyes upon the ground. Then she looked up and said, I do not know where Kansas is, for I have never heard that country mentioned before. But tell me, is it a civilized country?\n\n"+

        // "Oh, yes, replied Dorothy.\n\n"+

        // "Then that accounts for it. In the civilized countries I believe there are no witches left, nor wizards, nor sorceresses, nor magicians. But, you see, the Land of Oz has never been civilized, for we are cut off from all the rest of the world. Therefore we still have witches and wizards amongst us.\n\n"+

        // "Who are the wizards? asked Dorothy.\n\n"+

        // "Oz himself is the Great Wizard, answered the Witch, sinking her voice to a whisper. He is more powerful than all the rest of us together. He lives in the City of Emeralds.\n\n"+

        // "Dorothy was going to ask another question, but just then the Munchkins, who had been standing silently by, gave a loud shout and pointed to the corner of the house where the Wicked Witch had been lying.\n\n"+

        // "What is it? asked the little old woman, and looked, and began to laugh. The feet of the dead Witch had disappeared entirely, and nothing was left but the silver shoes.\n\n"+

        // "She was so old, explained the Witch of the North, that she dried up quickly in the sun. That is the end of her. But the silver shoes are yours, and you shall have them to wear. She reached down and picked up the shoes, and after shaking the dust out of them handed them to Dorothy.\n\n"+

        // "The Witch of the East was proud of those silver shoes, said one of the Munchkins, and there is some charm connected with them; but what it is we never knew.\n\n"+

        // "Dorothy carried the shoes into the house and placed them on the table. Then she came out again to the Munchkins and said:\n\n"+

        // "I am anxious to get back to my aunt and uncle, for I am sure they will worry about me. Can you help me find my way?\n\n"+

        // "The Munchkins and the Witch first looked at one another, and then at Dorothy, and then shook their heads.\n\n"+

        // "At the East, not far from here, said one, there is a great desert, and none could live to cross it.\n\n"+

        // "It is the same at the South, said another, for I have been there and seen it. The South is the country of the Quadlings.\n\n"+

        // "I am told, said the third man, that it is the same at the West. And that country, where the Winkies live, is ruled by the Wicked Witch of the West, who would make you her slave if you passed her way.\n\n"+

        // "The North is my home, said the old lady, and at its edge is the same great desert that surrounds this Land of Oz. I’m afraid, my dear, you will have to live with us.\n\n"+

        // "Dorothy began to sob at this, for she felt lonely among all these strange people. Her tears seemed to grieve the kind-hearted Munchkins, for they immediately took out their handkerchiefs and began to weep also. As for the little old woman, she took off her cap and balanced the point on the end of her nose, while she counted One, two, three in a solemn voice. At once the cap changed to a slate, on which was written in big, white chalk marks:\n\n"+

        // "LET DOROTHY GO TO THE CITY OF EMERALDS\n\n"+

        // "The little old woman took the slate from her nose, and having read the words on it, asked, Is your name Dorothy, my dear?\n\n"+

        // "Yes, answered the child, looking up and drying her tears.\n\n"+

        // "Then you must go to the City of Emeralds. Perhaps Oz will help you.\n\n"+

        // "Where is this city? asked Dorothy.\n\n"+

        // "It is exactly in the center of the country, and is ruled by Oz, the Great Wizard I told you of.\n\n"+

        // "Is he a good man? inquired the girl anxiously.\n\n"+

        // "He is a good Wizard. Whether he is a man or not I cannot tell, for I have never seen him.\n\n"+

        // "How can I get there? asked Dorothy.\n\n"+

        // "You must walk. It is a long journey, through a country that is sometimes pleasant and sometimes dark and terrible. However, I will use all the magic arts I know of to keep you from harm.\n\n"+

        // "Won’t you go with me? pleaded the girl, who had begun to look upon the little old woman as her only friend.\n\n"+

        // "No, I cannot do that, she replied, but I will give you my kiss, and no one will dare injure a person who has been kissed by the Witch of the North.\n\n"+

        // "She came close to Dorothy and kissed her gently on the forehead. Where her lips touched the girl they left a round, shining mark, as Dorothy found out soon after.\n\n"+

        // "The road to the City of Emeralds is paved with yellow brick, said the Witch, so you cannot miss it. When you get to Oz do not be afraid of him, but tell your story and ask him to help you. Good-bye, my dear.\n\n"+

        // "The three Munchkins bowed low to her and wished her a pleasant journey, after which they walked away through the trees. The Witch gave Dorothy a friendly little nod, whirled around on her left heel three times, and straightway disappeared, much to the surprise of little Toto, who barked after her loudly enough when she had gone, because he had been afraid even to growl while she stood by.\n\n"+

        // "But Dorothy, knowing her to be a witch, had expected her to disappear in just that way, and was not surprised in the least.\n\n"

        // "From this distant vantage point, the Earth might not seem of any particular interest. But for us, it's different. Consider again at that dot. That's here. That's home. That's us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives. The aggregate of our joy and suffering, thousands of confident religions, ideologies, and economic doctrines, every hunter and forager, every hero and coward, every creator and destroyer of civilization, every king and peasant, every young couple in love, every mother and father, hopeful child, inventor and explorer, every teacher of morals, every corrupt politician, every 'superstar,' every 'supreme leader,' every saint and sinner in the history of our species lived there--on a mote of dust suspended in a sunbeam.\n\n\n\n" +
        // "The Earth is a very small stage in a vast cosmic arena. Think of the rivers of blood spilled by all those generals and emperors so that, in glory and triumph, they could become the momentary masters of a fraction of a dot. Think of the endless cruelties visited by the inhabitants of one corner of this pixel on the scarcely distinguishable inhabitants of some other corner, how frequent their misunderstandings, how eager they are to kill one another, how fervent their hatreds.\n\n\n\n" +
        // "Our posturings, our imagined self-importance, the delusion that we have some privileged position in the Universe, are challenged by this point of pale light. Our planet is a lonely speck in the great enveloping cosmic dark. In our obscurity, in all this vastness, there is no hint that help will come from elsewhere to save us from ourselves.\n\n\n\n" +
        // "The Earth is the only world known so far to harbor life. There is nowhere else, at least in the near future, to which our species could migrate. Visit, yes. Settle, not yet. Like it or not, for the moment the Earth is where we make our stand.\n\n\n\n" +

        // "It has been said that astronomy is a humbling and character-building experience. There is perhaps no better demonstration of the folly of human conceits than this distant image of our tiny world. To me, it underscores our responsibility to deal more kindly with one another, and to preserve and cherish the pale blue dot, the only home we've ever known."
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