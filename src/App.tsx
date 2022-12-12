import React, { useState, useEffect, useRef } from "react";
import mqtt, { MqttClient } from "precompiled-mqtt";
import uuid from "react-uuid";


type topic = {
  [topic: string]: {
    qos: number,
    retain: boolean,
  }
}


export default function Mqtt() {
  const [protocol, setProtocol] = useState('ws');   //protocol for url
  const [connectionOptions, setConnectionOptions] = useState({ url: "", port: "", username: "", password: "", clientId: "" })     //connection options for mqtt client
  const [url, setUrl] = useState("");   //url for mqtt client
  const [connectionStatus, setConnectionStatus] = useState({ status: false, message: 'not connected' });  //connection status and message
  const [topicPublish, setTopicPublish] = useState<string>('')
  const [messagePublish, setMessagePublish] = useState<string>('')
  const [client, setClient] = useState<MqttClient>();
  const [messages, setMessages] = useState<Array<{ key: string, message: any }>>([]);  //array of messages to be rendered
  const [topicsList, setTopicsList] = useState([] as string[]);   //array of topics to be rendered
  let messageList: Array<{}> = [];   //mutable buffer to hold messages
  const topicRef = useRef<HTMLInputElement>(null);
  const [addMoreTopics, setAddMoreTopics] = useState({ status: true, message: "" });
  const protocols = ["ws", "wss", "wxls", "tcp", "tls", "mqtt", "mqtts", "http", "https", "alis"]
  const regex = new RegExp('\\s', 'g');   //regex to check for spaces



  const inputStyle = "p-2 w-48 m-1 h-8 rounded-md"  //input element style
  const buttonStyle = "bg-blue-800 p-1 m-1 rounded-md text-gray-100 w-fit" //button element style

  const clientConnect = (e: React.SyntheticEvent<HTMLButtonElement>) => {   //onClick handler to connect to broker
    e.preventDefault();
    setMessages([]);
    setTopicsList([]);
    setConnectionStatus({ status: false, message: 'connecting.....' })
    let fullUrl = `${protocol}://${connectionOptions.url}:${connectionOptions.port}`;
    const options = { username: connectionOptions.username, password: connectionOptions.password, clientId: connectionOptions.clientId }
    setUrl(fullUrl);
    console.log(fullUrl);
    setConnectionOptions(connectionOptions)
    setClient(mqtt.connect(fullUrl, options));
  };

  const clientDisconnect = (e: React.SyntheticEvent<HTMLButtonElement>) => {    //onClick handler to disconnect from broker
    e.stopPropagation();
    client?.end();
    setClient(undefined);
    setConnectionStatus({ status: false, message: 'not connected' });
  }

  const addTopic = (e: React.SyntheticEvent<HTMLButtonElement>) => {          //onClick handler to subscribe to topic
    e.preventDefault();
    if (topicRef.current) {
      const topic = topicRef.current.value;
      if (topicsList.includes(topic)) return;
      topicsList.push(topic);
      setTopicsList([...topicsList]);
      topicRef.current.value = "";
      console.log(topicsList);
      client?.subscribe(topic, () => {
      });
    }
  }

  const removeTopic = (e: React.SyntheticEvent<HTMLButtonElement>) => {         //onClick handler to unsubscribe from topic and modify message list
    let topic: string = e.currentTarget.id;

    client?.unsubscribe(topic, () => {
      topicsList.splice(topicsList.indexOf(topic), 1);
      messageList.splice(topicsList.indexOf(topic), 1);
      for (let i = 0; i < messages.length; i++) {
        if (messages[i].key === topic) {
          messages.splice(i, 1);
          setMessages(messages)
        }
      }
      setTopicsList([...topicsList]);
      console.log(topicsList);
    });

  }

  const checkString = (string: string) => {
    const replace = string.replace(regex, '');
    console.log(replace);
    return replace;
  }
  const publish = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const string = checkString(topicPublish);
    client?.publish(string, messagePublish);
    setMessagePublish('');
  }       //onClick handler to publish to topic

  const handleOptions = (e: React.SyntheticEvent<HTMLInputElement>) => {     //onChange handler to set connection options
    e.preventDefault();
    const item = e.currentTarget.id;
    connectionOptions[item as keyof typeof connectionOptions] = e.currentTarget.value;
    setConnectionOptions(connectionOptions);
    // console.log(connectionOptions);
  }

  useEffect(() => {
    if (client) {
      client.on("connect", () => {                                        //mqtt api, on client connection
        setConnectionStatus({ status: true, message: ` Connected to ${url}` });
        client.on("reconnect", () => {                            //mqtt api, on client reconnect
          setConnectionStatus({ status: false, message: ` reconnecting to ${url}` });
        });
      });
      if (addMoreTopics.status) {
        client.on('message', (topic: any, message: any) => {            //mqtt api, on message received
          messageList[topic.toString()] = message.toString();
          if (topicsList.includes(topic.toString()) === false) {
            topicsList.push(topic.toString())
          }

          if (messageList.length >= 50) {     //limit number of messages to 50 to prevent browser crash
            setAddMoreTopics({ status: false, message: "Too many messages!!!!  try subscribing to specific topics,not wildcards '#'" });
            clientDisconnect(new Event('click') as any);
          }
          convertMessageList();
        })
      }
    }
  }, [client]);


  const convertMessageList = () => { //convert messageList object to array and assign to messages state
    let messageArray: typeof messages = [];
    for (let key in messageList) {
      messageArray.push({ key: key, message: messageList[key] });       //ex. [{key: 'temp/current', message: '20'}]
    }
    setMessages(messageArray);
  }

  return (
    <div className="bg-gray-600 min-h-screen min-w-screen flex flex-col">
      <h1 className="text-gray-100 text-2xl p-3 self-center">MQTT</h1>
      <div className="flex flex-col items-center">
        <form className="">
          <select className='m-2 h-8 w-24' onChange={(e) => { let newprotocol = e.currentTarget.value; setProtocol(newprotocol); console.log(protocol) }} >{protocols.map((protocol) => {
            return <option key={protocol} value={protocol}>{protocol}</option>
          })}</select>
          <input className={inputStyle} onChange={(e) => handleOptions(e)} type="text" id='url' placeholder="url" />
          <input className={inputStyle} onChange={(e) => handleOptions(e)} type="text" id='port' placeholder="port" />
          <input className={inputStyle} onChange={(e) => handleOptions(e)} type="text" id='clientId' placeholder="clientId" />
          <input className={inputStyle} onChange={(e) => handleOptions(e)} type="text" id='username' placeholder="username" />
          <input className={inputStyle} type="text" placeholder="pass" />
        </form>
        <div className="flex flex-row items-center">
          <button disabled={connectionStatus.status} className={buttonStyle} onClick={(e) => clientConnect(e)}>Connect</button>
          <button className={buttonStyle} onClick={(e) => { clientDisconnect(e) }}>Disconnect</button>
        </div>

        <p className={connectionStatus.status ? 'text-green-500' : 'text-red-600'}>
          Connection Status:{" "}
          {connectionStatus.message}
        </p>
      </div>
      <div className="">
        <div className=" flex flex-col items-center  ">
          <input className={inputStyle} ref={topicRef} placeholder='add topic subscription' type="text" />
          <button className={buttonStyle} onClick={(e) => addTopic(e)}>Add</button>
        </div>
        <div className="flex flex-col items-center ">
          <input className={inputStyle} onChange={(e) => { setTopicPublish(e.currentTarget.value) }} type="text" placeholder="topic" />
          <input className={inputStyle} onChange={(e) => { setMessagePublish(e.currentTarget.value) }} type="text" value={messagePublish} placeholder="message" />
          <button onClick={(e) => publish(e)} className={buttonStyle}>Publish to Topic</button>
        </div>

      </div>
      <p className="bg-gray-700 text-white border-b-2 border-black">Topics:</p>
      <p className="bg-gray-400 text-red-600">
        {!addMoreTopics.status &&
          <div>
            <p>{addMoreTopics.message}</p>
            <button className={buttonStyle} onClick={(e) => {
              setAddMoreTopics({ status: true, message: '' });
              clientConnect(e);
            }}>Try Reconnecting</button>
          </div>}
      </p>
      {topicsList.map((topic) => {
        return (
          <div className="flex flex-col bg-gray-500 text-white" key={uuid()}>
            <p className="m-1">{topic}
              <button id={topic} className='bg-blue-700 rounded-md pl-1 pr-1 m-1' onClick={(e) => removeTopic(e)}>x
              </button>
            </p>
          </div>
        )
      })
      }

      <div >
        <p className="bg-gray-700 border-b-2 text-white border-black"> Messages:</p>

        {messages.map((item) => {
          if (topicsList.includes(item.key) || topicsList.includes('#'))
            return (
              <div className="flex flex-row bg-slate-700 text-white" key={uuid()}>
                <p>
                  {item.key} : {item.message}</p>
              </div>
            )
        })}
      </div>
      <div className="messagesList">
      </div>
    </div>
  );
}
