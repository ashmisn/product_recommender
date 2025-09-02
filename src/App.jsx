import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { products as initialProducts } from './data/products';
import './App.css';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

function App() {
  const [userInput, setUserInput] = useState('');
  const [recommendations, setRecommendations] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  const handleGetRecommendations = async () => {
    if (!userInput) {
      setRecommendations(initialProducts);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"});

      const prompt = `
        Based on the following user query and product list, please recommend the best products.
        User Query: "${userInput}"
        
        Product List (in JSON format):
                ${JSON.stringify(initialProducts, null, 2)} 

        Your task is to return a JSON array of the integer 'id's of the recommended products.
        For example: [1, 5, 8].
        Return ONLY the JSON array and nothing else. Do not wrap it in markdown backticks.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
            console.log("Raw AI Response:", text);
      const sanitizedMessage = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);

      const recommendedIds = JSON.parse(sanitizedMessage);
      const filteredProducts = initialProducts.filter(p => recommendedIds.includes(p.id));
      setRecommendations(filteredProducts);

    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Sorry, I couldn't get recommendations. Please try again.");
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Product Recommender</h1>
      <div className="search-bar">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="e.g., I want a laptop under ₹60,000"
          onKeyPress={(e) => e.key === 'Enter' && handleGetRecommendations()}
        />
        <button onClick={handleGetRecommendations} disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Get Recommendations'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      
      <div className="product-list">
        {recommendations.length > 0 ? (
          recommendations.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p className="price">₹{product.price.toLocaleString('en-IN')}</p>
              <p className="category">{product.category}</p>
              <p>{product.description}</p>
            </div>
          ))
        ) : (
          !isLoading && <p>No products match your criteria.</p>
        )}
      </div>
    </div>
  );
}

export default App;