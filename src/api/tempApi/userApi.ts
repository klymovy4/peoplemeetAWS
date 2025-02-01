export const getUser = async (data: { email: string, password: string }) => {
   const baseUrl = import.meta.env.VITE_API_URL;
   console.log(baseUrl)
   fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
   })
       .then(response => {
          if (!response.ok) {
             throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json(); // Assuming the server responds with JSON
       })
       .then(data => {
          console.log('Success', data);
          return {status: 'success', data: data}
       })
       .catch((error) => {
          console.error('Error:', error);
          return {status: 'Faild', error: error}
       });
}