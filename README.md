<a href="https://spotify-clone-jrbauti19.vercel.app/" target="_blank">
  <p align="center">
    <img src="https://github.com/user-attachments/assets/726763a6-094a-42cf-878c-1e7d47a2e597" style="height: 250px"/>
  </p>
</a>

<p align="center">

<img src="https://img.shields.io/badge/Spotify-1ED760?style=for-the-badge&logo=spotify&logoColor=white" alt="Spotify Badge">
<img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React Badge">
<img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="Typescript Badge">
<img src="https://img.shields.io/badge/redux-%23593d88.svg?style=for-the-badge&logo=redux&logoColor=white" alt="Redux Badge">

</p>

# 🎧 Spotify Web Client Clone by Joshua Bautista

> [!IMPORTANT]
> Spotify Playback requires users to authenticate with a valid Spotify Premium subscription.

![gif](https://github.com/user-attachments/assets/2077cdef-f3fa-49c9-a905-9cc9ab6629fb)

## 🚀 About This Project

This is my personal implementation of a Spotify web client clone, showcasing modern React development practices and real-world API integration. Built as part of my portfolio to demonstrate expertise in **React, TypeScript, Redux, and external API integration**.

**Live Demo**: [spotify-clone-jrbauti19.vercel.app](https://spotify-react-web-client-zeta.vercel.app/)

## ✨ Key Features

🎵 **Real-time Music Playback**: Seamless audio streaming using Spotify's Playback SDK

🎛️ **Complete Playback Controls**: Play, pause, skip, shuffle, repeat, and volume control

🔍 **Advanced Search & Browse**: Discover songs, artists, albums, and playlists with intelligent filtering

📱 **Playlist Management**: Create, edit, delete, and organize custom playlists

💖 **Favorites System**: Like songs and manage your personal music library

📱 **Multi-Device Support**: Switch playback between desktop, mobile, and smart speakers

👤 **Artist Discovery**: Follow artists and explore their complete discographies

🎨 **Modern UI/UX**: Responsive design with smooth animations and intuitive navigation

## 🛠️ Tech Stack & Implementation

**Frontend Architecture:**

- ⚛️ **React 18** - Component-based architecture with hooks
- 🔷 **TypeScript** - Type-safe development for better code quality
- 🗃️ **Redux Toolkit** - Efficient state management with modern patterns
- 🎨 **CSS Modules** - Scoped styling with responsive design

**API Integration:**

- 🎵 **Spotify Web API** - Data fetching for playlists, albums, and user information
- 🔊 **Spotify Playback SDK** - Real-time music playback control
- 🔐 **OAuth 2.0** - Secure user authentication flow

**Development Tools:**

- 📦 **Vite/Webpack** - Fast development and optimized builds
- 🧪 **Jest & Testing Library** - Comprehensive testing suite
- 🚀 **Vercel** - Seamless deployment and hosting

## 🎯 What I Learned

- **Complex State Management**: Managing audio playback state across multiple components
- **External API Integration**: Working with Spotify's OAuth flow and REST APIs
- **Real-time Features**: Implementing live music playback and device switching
- **Performance Optimization**: Lazy loading, memoization, and efficient re-renders
- **TypeScript Best Practices**: Type-safe API responses and component props
- **Modern React Patterns**: Custom hooks, context providers, and compound components

## 📸 Screenshots

<div align="center">
    <table>
     <tr>
       <td>
         <img src="images/Home.png?raw=true" alt="Home Page"/>
         <img src="images/CurrentDevices.png?raw=true" alt="Device Selection"/>
       </td>
        <td>
         <img src="images/NewPlaylist.png?raw=true" alt="Create Playlist"/>
          <img src="images/browse.png?raw=true" alt="Browse Music"/>
       </td>
                 <td>
         <img src="images/Profile.png?raw=true" alt="User Profile"/>
          <img src="images/playlist.png?raw=true" alt="Playlist View"/>
       </td>
     </tr>
    </table>
</div>

## ⚙️ Local Development Setup

### Prerequisites

- Node.js 18+
- Yarn or npm
- Spotify Premium account (for playback features)

### Installation Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/jrbauti19/spotify-react-web-client.git
   cd spotify-react-web-client
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Spotify Developer App:**

   - Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
   - Create a new app
   - Add `http://localhost:3000` to Redirect URIs
   - Copy your Client ID

4. **Configure environment variables:**

   ```env
   REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id
   REACT_APP_SPOTIFY_REDIRECT_URL=http://localhost:3000
   ```

5. **Start development server:**

   ```bash
   yarn start
   ```

6. **Open your browser:**
   Navigate to `http://localhost:3000` and log in with your Spotify Premium account.

## 🚀 Deployment

This project is deployed on **Vercel** for optimal performance and automatic deployments.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jrbauti19/spotify-react-web-client)

## 🔧 Customizations & Improvements

**My Enhancements:**

- ✅ Modern React 18 patterns and hooks
- ✅ Improved TypeScript implementation
- ✅ Enhanced error handling and loading states
- ✅ Better responsive design for mobile devices
- ✅ Performance optimizations for large playlists
- ✅ Accessibility improvements (ARIA labels, keyboard navigation)

**Future Roadmap:**

- 🔄 Add offline playlist caching
- 🎨 Implement custom themes and dark mode
- 📊 Add music analytics and listening history
- 🔗 Social features (playlist sharing, friend activity)

## 🤝 Contributing

While this is primarily a portfolio project, I welcome suggestions and feedback! Feel free to:

- 🐛 Report bugs or issues
- 💡 Suggest new features
- 🔧 Submit pull requests for improvements

## 📧 Contact

**Joshua Bautista** - Software Developer

- 💼 [LinkedIn](https://linkedin.com/in/joshua-raphael-bautista-8a019a11b/)
- 📧 [jrbauti19@gmail.com](mailto:jrbauti19@gmail.com)
- 🌐 [Portfolio](https://self-portfolio-puce.vercel.app/)
- 💻 [GitHub](https://github.com/jrbauti19)

## 📝 License & Attribution

This project is licensed under the MIT License.

---

⭐ **If you found this project helpful, please give it a star!** ⭐
