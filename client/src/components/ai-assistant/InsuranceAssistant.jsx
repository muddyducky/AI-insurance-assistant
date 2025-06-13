import { useEffect, useState} from "react";
import styles from "./InsuranceAssistant.module.css";
import ReactMarkdown from "react-markdown";

export default function InsuranceAssistant() {
  const [showInput, setShowInput] = useState(false);
  const [customerInput, setCustomerInput] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);

  const welcomeText =
    "Welcome to Turners Cars Insurance. I'm Tina, your AI insurance consultant. Can I assist you in finding the best insurance cover?";
  const splitMessage = welcomeText.split(" ");
  const [displayMessage, setDisplayMessage] = useState("");

//___ WELCOME MESSAGE ___
//--This effect handles the welcome message display with a typing effect.
//...it splits the message into words and displays them one by one.
  useEffect(() => {
    let index = 1;
    setDisplayMessage(splitMessage[0]);

    const welcomeInterval = setInterval(() => {
      if (index < splitMessage.length) {
        setDisplayMessage(splitMessage.slice(0, index + 1).join(" "));
        index++;
      } else {
        clearInterval(welcomeInterval);
      }
    }, 150);

    return () => clearInterval(welcomeInterval);
  }, []);

//___ YES BUTTON HANDLING ___
//--This function is triggered when the user clicks the yes button.
//...it sets the input field to visible and sends an initial message to the AI.
  const handleYesClick = async () => {
    setShowInput(true);
    const userInitialMessage =
      "Yes, I would like assistance finding insurance cover.";
    const userMsgObj = {
      id: Date.now() + "-user-initial",
      role: "user",
      parts: [{ text: userInitialMessage }],
    };

//___ POST REQUEST ___
//--This part sends the initial message to the backend API and waits for a response.

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userInitialMessage, history: [] }),
      });

//___ HANDLE RESPONSE ___
//--This section processes the response from the backend.  
//...If the response is successful, it updates the conversation history with the AI's reply.
//--If the response is not ok, set an error message in the conversation history
      const data = await response.json();
      if (response.ok) {
        setConversationHistory([
          userMsgObj,
          {
            id: Date.now() + "-model-first",
            role: "model",
            parts: [{ text: data.reply }],
          },
        ]);
      } else {

        setConversationHistory([
          userMsgObj,
          {
            id: Date.now() + "-error",
            role: "model",
            parts: [{ text: "Sorry, something went wrong. Please try again." }],
          },
        ]);
      }

//___ HANDLE NETWORK ERROR ___
    } catch (error) {
      setConversationHistory([
        userMsgObj,
        {
          id: Date.now() + "-network-error",
          role: "model",
          parts: [
            { text: "Sorry, I cannot connect to the assistant right now." },
          ],
        },
      ]);
    }
  };

//___ SUBMIT HANDLER ___
//--This function handles the form submission when the user inputs their answer.  
//...It sends the user's input to the backend API and updates the conversation history.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerInput.trim()) return;

    const userMsgObj = {
      id: Date.now() + "-user",
      role: "user",
      parts: [{ text: customerInput }],
    };

//___ CONVERSATION HISTORY FOR BACKEND ___
//--This part prepares the conversation history to be sent to the backend.

//___ POST REQUEST TO BACKEND ___
//--This section sends the user's input and conversation history to the backend API.


    const historyForBackend = [
      ...conversationHistory.map(({ role, parts }) => ({ role, parts })),
      { role: "user", parts: [{ text: customerInput }] },
    ];

    setCustomerInput("");

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: customerInput,
          history: historyForBackend,
        }),
      });

//___ HANDLE RESPONSE FROM BACKEND ___
      const data = await response.json();
      if (response.ok) {
        setConversationHistory((prevHistory) => [
          ...prevHistory,
          userMsgObj,
          {
            id: Date.now() + "-model",
            role: "model",
            parts: [{ text: data.reply }],
          },
        ]);
      } else {
        setConversationHistory((prevHistory) => [
          ...prevHistory,
          userMsgObj,
          {
            id: Date.now() + "-error",
            role: "model",
            parts: [{ text: "Sorry, something went wrong. Please try again." }],
          },
        ]);
      }
    } catch (error) {
      setConversationHistory((prevHistory) => [
        ...prevHistory,
        userMsgObj,
        {
          id: Date.now() + "-network-error",
          role: "model",
          parts: [
            { text: "Sorry, I cannot connect to the assistant right now." },
          ],
        },
      ]);
    }
  };

  return (
    <form className={styles.insuranceAssistant} onSubmit={handleSubmit}>
      <div className={styles.chatWindow}>
        {!showInput ? (
          <p>{displayMessage}</p>
        ) : (
          <div ref={chatWindowRef} className={styles.chatHistory}>
            {conversationHistory.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.role === "user" ? styles.userMessage : styles.aiMessage
                }
              >
                <div className={styles.senderName}>
                  {msg.role === "user" ? "YOU" : "TINA"}
                </div>
                <div>
                  <ReactMarkdown>
                    {msg.parts[0].text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleYesClick}
          className={showInput ? styles.hidden : ""}
        >
          Yes
        </button>
      </div>

      {showInput && (
        <>
          <input
            type="text"
            className={styles.customerInput}
            placeholder="Enter your answers here..."
            value={customerInput}
            onChange={(e) => setCustomerInput(e.target.value)}
          />
          <button type="submit">Submit</button>
        </>
      )}
    </form>
  );
}
