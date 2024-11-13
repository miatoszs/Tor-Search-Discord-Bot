const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('torsearch')
    .setDescription('Search the Tor network using Ahmia')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The term to search on the Tor network')
        .setRequired(true)),
  async execute(interaction) {
    const query = interaction.options.getString('query');
    const searchUrl = `https://ahmia.fi/search/?q=${encodeURIComponent(query)}`;

    try {
      await interaction.deferReply();

      // Fetch Ahmia's search results page
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 20000, // 20 seconds timeout
      });

      // Parse HTML and extract .onion results
      const results = parseAhmiaHTML(response.data);
      if (results.length === 0) {
        await interaction.editReply('No .onion links found.');
        return;
      }

      // Create an embed to display the results
      const embed = new EmbedBuilder()
        .setTitle(`Search Results for "${query}"`)
        .setColor(0x1da1f2) // Set the color of the embed
        .setDescription(`Top .onion links from Ahmia`);

      // Add each result as a field in the embed, up to a maximum of 5 results
      results.slice(0, 5).forEach((result, index) => {
        embed.addFields({ name: `Result ${index + 1}`, value: `[${result.title}](${result.link})` });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error during Ahmia search request:', error.message);
      await interaction.editReply('Error performing search. The service may be down or inaccessible.');
    }
  },
};

// Function to parse the HTML response from Ahmia and extract direct .onion links
function parseAhmiaHTML(html) {
  const $ = cheerio.load(html);
  const results = [];

  // Ahmia's search results might be in anchor tags within specific result elements (adjust selector if needed)
  $('a[href*="redirect_url"]').each((i, element) => {
    const title = $(element).text().trim() || 'No title';
    const redirectLink = $(element).attr('href');

    // Extract the actual .onion link from the redirect URL
    const urlMatch = redirectLink.match(/redirect_url=(http[^&]*)/);
    if (urlMatch) {
      const decodedLink = decodeURIComponent(urlMatch[1]);
      if (decodedLink.includes('.onion')) {
        results.push({ title, link: decodedLink });
      }
    }
  });

  return results;
}
