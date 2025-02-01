export const getUser = async (data: { email: string; password: string }) => {
   try {
      // const mode = import.meta.env.MODE;
      // const baseApi = import.meta.env.VITE_API_URL;

      // const url = mode === 'development' ? `${baseApi}/login` : '/login';
      // console.log(url)
      const response = await fetch('/login', {  // Добавил baseUrl
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(data),
      });

      if (!response.ok) {
         throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Success', responseData);

      return {status: 'success', data: responseData};
   } catch (error) {
      console.error('Error:', error);
      return {status: 'failed', error: error};
   }
};