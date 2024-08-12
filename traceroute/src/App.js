import "./global.css";
import MapComponent from "./screens/home";
import Context from "./contex";

function App() {
    return (
        <Context>
            <MapComponent />
        </Context>
    );
}

export default App;
