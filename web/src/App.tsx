import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

const qc = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={qc}>
      <div>Here</div>
      <AppInner />
    </QueryClientProvider>
  );
}

function AppInner() {
  return (
    <div>Here is another piece of text.</div>
  )
  // const qry = useQuery({
  //   queryKey: ["/api/test"],
  //   queryFn: async () => {
  //     const resp = await fetch(
  //       `https://${import.meta.env.VITE_BACKEND_HOST}/api/test`
  //     );
  //     if (!resp.ok) {
  //       throw new Error();
  //     }
  //     return resp.json();
  //   },
  // });
  // if (qry.status === "error") {
  //   return <div>Error...</div>;
  // }
  // if (qry.status === "pending") {
  //   return <div>Loading...</div>;
  // }
  // return <div>{JSON.stringify(qry.data)}</div>;
}

export default App;
