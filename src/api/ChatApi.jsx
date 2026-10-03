export const sendChatMessage = async (message, file) => {
  const formData = new FormData();
  formData.append("message", message);
  if (file) {
    formData.append("file", file);
  }

  const response = await fetch("http://localhost:8080/api/chat", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}`);
  }
  return response.json();
};