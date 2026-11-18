export const success = (data, status = 200) => {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff"
    }
  });
};

export const error = (message, status = 500) => {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff"
    }
  });
};
