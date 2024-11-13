const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search the web using DuckDuckGo')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The term to search on DuckDuckGo')
        .setRequired(true)),
  async execute(interaction) {
    const query = interaction.options.getString('query');
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    try {
      await interaction.deferReply();

      // Fetch DuckDuckGo's search results page
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 20000, // 20 seconds timeout
      });

      // Parse HTML and extract results
      const results = parseDuckDuckGoHTML(response.data);
      if (results.length === 0) {
        await interaction.editReply('No results found.');
        return;
      }

      // Create an embed to display the results
      const embed = new EmbedBuilder()
        .setTitle(`Search Results for "${query}"`)
        .setColor(0x1da1f2) // Set the color of the embed
        .setDescription(`Top results from DuckDuckGo`);

      // Add each result as a field in the embed, up to a maximum of 5 results
      results.slice(0, 5).forEach((result, index) => {
        embed.addFields({ name: `Result ${index + 1}`, value: `[${result.title}](${result.link})` });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error during DuckDuckGo search request:', error.message);
      await interaction.editReply('Error performing search. The service may be down or inaccessible.');
    }
  },
};

// Function to parse the HTML response from DuckDuckGo and decode the original URLs
function parseDuckDuckGoHTML(html) {
  const $ = cheerio.load(html);
  const results = [];

  // DuckDuckGo's search results are in `.result__a` anchor tags within `.result__title`
  $('.result__title .result__a').each((i, element) => {
    const title = $(element).text().trim();
    const relativeLink = $(element).attr('href');
    const linkMatch = relativeLink.match(/uddg=([^&]*)/); // Extract the 'uddg' parameter

    if (title && linkMatch && !linkMatch[1].includes('.onion')) {
      const decodedLink = decodeURIComponent(linkMatch[1]); // Decode the original link
      results.push({ title, link: decodedLink });
    }
  });

  return results;
}
