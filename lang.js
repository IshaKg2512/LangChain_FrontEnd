// Mock Data & Database Calls
async function fetchEngagementData(postType) {
    const mockData = [
      { postType: 'carousel', likes: 120, shares: 30, comments: 15 },
      { postType: 'reels', likes: 200, shares: 40, comments: 50 },
      { postType: 'static', likes: 90, shares: 10, comments: 5 },
    ];
    const filtered = mockData.filter((item) => item.postType === postType);
    if (filtered.length === 0) return null;
    return new Promise((resolve) => setTimeout(() => resolve(filtered), 500));
  }
  
  async function analyzeDataWithLangflow(data) {
    const totalLikes = data.reduce((sum, item) => sum + item.likes, 0);
    const totalShares = data.reduce((sum, item) => sum + item.shares, 0);
    const totalComments = data.reduce((sum, item) => sum + item.comments, 0);
    const avgLikes = (totalLikes / data.length).toFixed(1);
    const avgShares = (totalShares / data.length).toFixed(1);
    const avgComments = (totalComments / data.length).toFixed(1);
    const insight = generateGPTInsights(avgLikes, avgShares, avgComments);
    return new Promise((resolve) =>
      setTimeout(() => resolve({ avgLikes, avgShares, avgComments, insight }), 500)
    );
  }
  
  function generateGPTInsights(avgLikes, avgShares, avgComments) {
    return `Your posts show an average of ${avgLikes} likes, ${avgShares} shares, and ${avgComments} comments. This indicates a strong engagement rate overall. Consider exploring more user-generated content to drive even higher comments.`;
  }
  
  const ctaButton = document.getElementById('ctaButton');
  const resultsSection = document.getElementById('resultsSection');
  
  ctaButton.addEventListener('click', async () => {
    const userPostType = prompt('Enter the type of post: "carousel", "reels", or "static"');
    if (!userPostType) {
      alert('No post type provided. Please try again.');
      return;
    }
  
    const engagementData = await fetchEngagementData(userPostType.toLowerCase());
    if (!engagementData) {
      alert('No data found for that post type. Please try "carousel", "reels", or "static".');
      return;
    }
  
    const analysis = await analyzeDataWithLangflow(engagementData);
    displayResults(userPostType, analysis);
  });
  
  function displayResults(postType, analysis) {
    resultsSection.innerHTML = `
      <div class="result">
        <h2>Post Type: ${postType.toUpperCase()}</h2>
        <p><strong>Average Likes:</strong> ${analysis.avgLikes}</p>
        <p><strong>Average Shares:</strong> ${analysis.avgShares}</p>
        <p><strong>Average Comments:</strong> ${analysis.avgComments}</p>
        <p><strong>GPT Insights:</strong> ${analysis.insight}</p>
      </div>
    `;
  }
  