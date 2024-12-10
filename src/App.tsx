import './App.css'

function App() {

   const test = () => {
      console.log('YES')
   }

  return (
    <>
      <div>
        <h4>Hello People meet =)</h4>
         <p>let start to do the best </p>
         <p>test 1</p>

         <p>Hello let's start</p>

         <button onClick={() => console.log(123)}>Click</button>
         <button onClick={() => test()}>Click 2</button>
      </div>
    </>
  )
}

export default App
