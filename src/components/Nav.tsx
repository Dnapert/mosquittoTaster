import { useState } from "react";

export const NavBar = () => {
    const [visible, setVisible] = useState(false);
    return (
        <nav className="bg-gray-800  ">
            <div className="">
                <button onClick={(e) => { setVisible(!visible) }} className="bg-blue-600 rounded-md m-1 p-1">About</button>
            </div>
            {visible && <div className="bg-gray-700 text-white">
                <p>
                    I needed a way to quickly test my MQTT broker so I put together this simple vite React app to allow basic functionality of a MQTT client. It is not meant to be a full featured MQTT client but rather a quick way to test your broker.
                </p>
            </div>}
        </nav>
    )
}