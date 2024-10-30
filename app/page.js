"use client";
import Image from "next/image";
import { Button, IconButton, Input, Typography } from "@material-tailwind/react";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMicrophone, faSearch } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useRef, useState } from "react";
import { axiosPrivate, axiosPublic } from "@/api/apiConfig";
import { useRouter } from "next/router";


export default function Home() {

  const [isTextQuery, setIsTextQuery] = useState(false);

  const [error, setError] = useState('');

  const [conversations, setConversations] = useState([]);

  const [searchInput, setSearchInput] = useState(null);

  const [auth, setAuth] = useState({});

  const [newConversation, setNewConversation] = useState({});

  const [spokenTranscript, setSpokenTranscript] = useState('');

  // Function to handle the start of a long press
  function isPressed(e) {

    setIsTextQuery(!isTextQuery);
  }


  function continueWithGoogle() {
    window.location.href = `${process.env.NEXT_PUBLIC_BASEURL}/v1/auth/google`;
  }

  const isMount = useRef(false);


  useEffect(() => {

    // Only run this effect once on mount
    if (!isMount.current) {
      isMount.current = true; // Mark as mounted

      axiosPrivate.get("/v1/auth")
        .then(res => setAuth(res.data.data))
        .catch(err => setError(err));


      axiosPrivate.get("/conversations")
        .then(res => {
          console.log(res.data.data)

          setConversations(res.data.data)
        })
        .catch(err => setError(err));
    }

    // Cleanup (not needed in this case since isMount persists after unmount)
    return () => {
      isMount.current = true;
    };
  }, []);


  const createVoiceConversation = async (e) => {
    if (!('webkitSpeechRecognition' in window) || !('speechSynthesis' in window)) {
      alert("Your browser does not support voice recognition or speech synthesis.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      alert("Voice recognition started.");
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;

      setSpokenTranscript(transcript);

      // Generate a response based on the user's input
      const responseText = await generateAndSaveResponse(transcript);
      // Speak the response to the user
      speakResponse(responseText);
    };

    recognition.onerror = (event) => {
      alert("An error occurred during voice recognition: " + event.error);
    };

    recognition.onend = () => {
      setIsRecording(false);
      alert("Voice recognition ended.");
    };

    recognition.start();
  };

  // Function to generate a response based on user's transcript
  const generateAndSaveResponse = async (transcript) => {

    //save data to the backend
    axiosPrivate.post("/conversations", {
      asked_conversation_data: transcript,
    })
      .then(res => {
        setNewConversation(res.data.data?.response_text);

      })
      .catch(err => setError(err));
    return newConversation;

  };

  // Function to use SpeechSynthesis to speak a response
  const speakResponse = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };



  const createTextConversation = async (e) => {
    alert('search input', searchInput)
  }



  return (
    <div className="bg-gray-50 h-screen w-screen">

      <div className="md:grid grid-cols-12">
        <div className="col-span-2 relative h-screen bg-[#020617]">
          {/* Company Logo Section */}
          <div className="logo w-fit mx-auto mt-5">
            <Image src={"/logo.png"} width={180} height={50} priority alt="Logo" />
          </div>


          {/* Link to Generated */}
          <div className="w-full md:h-[500px] overflow-y-auto">
            {
              conversations.length > 0 ? (
                <div className="">
                  {
                    conversations.map(conversation => (
                      <Link href={`?token=${conversation._id}`}>
                        <section className="border-t mt-5 cursor-pointer border-gray-700 w-11/12 mx-auto rounded-lg hover:bg-blue-gray-900 p-3 ">
                          <Typography as={"h3"} className="text-base text-purple-100">{conversation?.asked_conversation_data.split(" ").slice(0, 24).join(" ") + "..."}</Typography>
                          <Typography as={"h5"} className="text-sm text-white">{conversation.asked_conversation_data.split(" ").slice(0, 55).join(" ") + "..."} </Typography>
                        </section>
                      </Link>
                    ))
                  }
                </div>
              ) : <div className=" text-center w-full mt-5 px-4 text-sm poppins-regular text-[#ebeef0]">{
                auth ? <p>No conversation found</p> : <p>Not Conversation yet, sign in to continue</p>
              }</div>
            }


          </div>
          {/* Footer - Google Sign In */}
          <div className="google-auth-wrapper w-fit mx-auto absolute bottom-5 left-0 right-0">
            {
              auth ? (
                <div className="grid gap-1 grid-cols-12">
                  <div className="col-span-2 mt-1">
                    <Image src={auth.profile_img} className="rounded-full" priority width={55} height={55} alt={auth.display_name} />
                  </div>
                  <div className="col-span-10 text-white">
                    <h3 className="poppins-semibold poppins-regular">{auth?.display_name}</h3>
                    <h3 className="text-xs poppins-regular">{auth?.email}</h3>
                  </div>
                </div>
              ) : (
                <Button onClick={continueWithGoogle} className="capitalize poppins-regular font-medium bg-purple-700">Continue with Google</Button>
              )
            }
          </div>
        </div>
        <div className="col-span-7 relative">

          <div className="conversation-container ">
            <form method="post" className="absolute bottom-5 left-5 right-5">
              <div className="relative">
                <Input className="" onChange={(e) => setSearchInput(e.target.value)} name="searchInput" label="Tap button to start a conversation" variant="outlined" />
                <div className="record-or-search-action z-50 absolute top-0 right-0">
                  <IconButton id="buttonStart" className="bg-purple-800">
                    <FontAwesomeIcon onClick={(e) => {
                        createVoiceConversation();
                    }} icon={isTextQuery ? faSearch : faMicrophone} /> {/* Solid Icon */}
                  </IconButton>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div className="col-span-3 px-5 h-screen bg-[#020617]">
          <fieldset className="border-t-2 md:mt-7 border-gray-500 w-full">
            <legend className="poppins-medium px-4 text-white w-fit mx-auto mt-4">Recent Transcription</legend>

            <p className="text-white mt-5">{spokenTranscript ?? ' '}</p>
          </fieldset>
        </div>
      </div>

    </div>
  );
}
