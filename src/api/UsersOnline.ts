export const getUsersOnline = async () => {
   const data = {
      token: localStorage.getItem('accessToken')
   };

   try {
      const response = await fetch('/online_users', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(data)
      });

      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      console.log('Users online data:', json);
      return json; // если нужно где-то использовать
   } catch (err) {
      console.error('Error fetching online users:', err);
   }
};