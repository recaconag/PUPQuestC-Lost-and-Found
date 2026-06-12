import { Provider } from "react-redux";
import { store } from "../redux/store";
import { OnlineStatusProvider } from "../contexts/OnlineStatusContext";

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <Provider store={store}>
      <OnlineStatusProvider>
        {children}
      </OnlineStatusProvider>
    </Provider>
  );
};

export default Providers;
