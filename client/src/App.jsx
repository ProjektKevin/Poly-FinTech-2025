// // import dependencies
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { useState, useCallback } from "react";

// // import components
// import TestPage from './pages/TestPage'
// import ErrorPage from './pages/ErrorPage'
// import CaregiverPage from './pages/CaregiverPage'
// import PatientPage from './pages/PatientPage'
// import Navbar from "@/components/system/Navbar"
// import Sidebar from "@/components/system/Sidebar"

// function App() {
//   // State to hold the create item handler from the active page
//   const [createItemHandler, setCreateItemHandler] = useState(null);

//   // Wrapper function that calls the handler if it exists
//   const handleCreateItem = useCallback(async (itemData, onProgress) => {
//     console.log('App.jsx handleCreateItem called with:', itemData);
    
//     if (createItemHandler) {
//       // Call the handler from the active page (CaregiverPage or PatientPage)
//       return await createItemHandler(itemData, onProgress);
//     } else {
//       console.warn('No create item handler available');
//       throw new Error('Create item handler not available');
//     }
//   }, [createItemHandler]);

//   return (
//     <BrowserRouter>
//       <div className="h-screen flex flex-col">
//         <Navbar/>
//         <div className="flex flex-1 overflow-hidden">
//           <Sidebar onCreateItem={handleCreateItem} />
//           <main className="flex-1 overflow-auto p-6">
//             <Routes>
//               <Route path="/test" element={<TestPage />} />
//               <Route 
//                 path="/caregiver/*" 
//                 element={<CaregiverPage setCreateItemHandler={setCreateItemHandler} />} 
//               />
//               <Route 
//                 path="/patient/*" 
//                 element={<PatientPage setCreateItemHandler={setCreateItemHandler} />} 
//               />
//               <Route path="*" element={<ErrorPage />} />
//             </Routes>
//           </main>
//         </div>
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;

// import dependencies
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useCallback } from "react";

// import components
import TestPage from './pages/TestPage'
import ErrorPage from './pages/ErrorPage'
import CaregiverPage from './pages/CaregiverPage'
import PatientPage from './pages/PatientPage'
import Navbar from "@/components/system/Navbar"
import Sidebar from "@/components/system/Sidebar"

function App() {
  // State to hold the create item handler from the active page
  const [createItemHandler, setCreateItemHandler] = useState(null);

  // Wrapper function that calls the handler if it exists
  const handleCreateItem = useCallback(async (itemData, onProgress) => {
    console.log('App.jsx handleCreateItem called with:', itemData);
    
    if (createItemHandler) {
      // Call the handler from the active page (CaregiverPage or PatientPage)
      return await createItemHandler(itemData, onProgress);
    } else {
      console.warn('No create item handler available');
      throw new Error('Create item handler not available');
    }
  }, [createItemHandler]);

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col">
        <Navbar/>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar onCreateItem={handleCreateItem} />
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/test" element={<TestPage />} />
              <Route 
                path="/caregiver/*" 
                element={<CaregiverPage setCreateItemHandler={setCreateItemHandler} />} 
              />
              <Route 
                path="/patient/*" 
                element={
                  <PatientPage 
                    setCreateItemHandler={setCreateItemHandler}
                    onCreateActionVideo={handleCreateItem}
                  />
                } 
              />
              <Route path="*" element={<ErrorPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;