import { useEffect, useState } from "react";
import OpenAI from "openai";
import "dotenv/config";

import "./App.css";
import storiesExamples from "./storiesExamples";

function App() {
  const [value, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState();
  const [episode, setEpisode] = useState(0);

  useEffect(() => {
    if (!stories) return;
    tellStory(stories[episode].script);
  }, [stories, episode]);

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const generateScenario = async () => {
    const content = `You're a screenwriter. Here's a short story idea. Write the long script in french based on this story for a few part audio series with only one narrator and any character. Do not specify any noise in this script. Then generate a prompt to create an illustration image for each part.
  The structure of your response will be JSON in the following form :
  { script: string, illustration_prompt: string }[]
  story: ${value}`;
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content }],
      model: "gpt-3.5-turbo",
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response;
  };

  const generateImage = async (prompt) => {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });
    console.log("response", response);
    return response.data[0].url;
  };

  const tellStory = (scenario) => {
    const utterThis = new SpeechSynthesisUtterance(scenario);
    utterThis.lang = "fr-FR";
    window.speechSynthesis.speak(utterThis);
  };

  const generate = async () => {
    setLoading(true);

    const scenario = await generateScenario();
    let generatedStories = [];
    for (const episode of scenario) {
      const img = await generateImage(episode.illustration_prompt);
      generatedStories.push({ script: episode.script, img });
    }

    setLoading(false);
    setStories(generatedStories);
  };

  return (
    <div className="App">
      <div className="App-header">
        {stories ? (
          <>
            <h3>
              <div>
                <button
                  disabled={!(episode > 0)}
                  onClick={() => setEpisode(episode - 1)}
                >
                  {"<-"}
                </button>
                Episode {episode + 1}
                <button
                  disabled={!(episode < stories.length - 1)}
                  onClick={() => setEpisode(episode + 1)}
                >
                  {"->"}
                </button>
              </div>
            </h3>
            <p>{stories[episode].script}</p>

            <img src={stories[episode].img} alt="illustration" />

            <button
              onClick={() => window.speechSynthesis.cancel()}
              style={{ marginTop: 50 }}
            >
              stop speaking
            </button>
            <button
              onClick={() => {
                setEpisode(0);
                setStories();
              }}
              style={{ marginTop: 25 }}
            >
              regenerate
            </button>
          </>
        ) : (
          <>
            <h3>Netflix GPT</h3>
            <p>Ask me a story and I will generate a short audio serie</p>
            <div>
              <button
                disabled={loading}
                onClick={() => setInput(storiesExamples.adventure)}
              >
                Adventure
              </button>
              <button
                disabled={loading}
                onClick={() => setInput(storiesExamples.loveRomance)}
              >
                Love romance
              </button>
              <button
                disabled={loading}
                onClick={() => setInput(storiesExamples.fantasy)}
              >
                Fantasy
              </button>
              <button
                disabled={loading}
                onClick={() => setInput(storiesExamples.comedy)}
              >
                Comedy
              </button>
              <button disabled={loading} onClick={() => setInput("")}>
                Empty
              </button>
            </div>
            <textarea
              type="text"
              placeholder="Ask me a story"
              value={value}
              onInput={(e) => setInput(e.target.value)}
              cols="40"
              rows="5"
            />
            <button disabled={loading} onClick={generate}>
              generate
            </button>

            {loading && <div class="loader"></div>}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
