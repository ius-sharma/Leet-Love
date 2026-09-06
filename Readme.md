<div align="center">

# ❤️ LeetLove

### Master Data Structures & Algorithms through Stories, Visuals, and Interactive Animations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Stop memorizing code. Start understanding the logic.**

</div>

---

## 🌟 About LeetLove

LeetCode and DSA can be overwhelming. Staring at static code blocks or reading heavy text explanations often leaves beginners and even experienced devs confused, especially when tackling Hard problems. 

**LeetLove** is built to change that. We transform complex algorithmic problems into **engaging stories, beautiful visuals, and interactive step-by-step animations**. Instead of just reading how a solution works, you *see* it, *click* through it, and *feel* the logic.

## ✨ Core Features

### 📖 1. Story-Driven Explanations
We don't just explain the code; we explain the *context*. Every concept is mapped to a real-world story or analogy. (e.g., Understanding the *Sliding Window* technique through a train journey, or *Graph BFS* through spreading a rumor in a school).

### 🎬 2. Interactive Step-by-Step Visuals
No passive video watching. LeetLove is fully interactive. 
* Click **"Next Step"** to see pointers move.
* Watch array elements swap in real-time.
* See recursion trees grow branch by branch.
You control the pace of the animation to fully grasp the logic.

### 🚀 3. Community-Driven Approaches
Found a better, more optimized approach? Don't just keep it to yourself! Users can submit their own code/logic for any LeetCode problem. 

### 🪄 4. AI-Powered Auto-Animation (The Magic!)
This is our killer feature. When a user uploads their custom approach:
1. Our AI analyzes the code/logic.
2. It breaks down the execution into step-by-step state changes.
3. The frontend automatically generates a **smooth, custom animated explanation** for that specific user approach!
*No manual animation creation required for community solutions.*

---

## 🛠️ How the Auto-Animation Works

The magic behind generating animations from user code happens in a 3-step pipeline:

1. **Code Execution & Tracing:** The user's code runs in a secure sandbox. We trace the execution, capturing variable states, pointer movements, and data structure changes at every step.
2. **AI State Generation:** An LLM processes the execution trace and converts it into a standardized `JSON` format representing visual states (e.g., `{ step: 1, action: "swap", indices: [0, 1] }`).
3. **Visual Rendering:** The frontend uses pre-built animation templates (Array, Linked List, Tree, Graph) and feeds the JSON into them, rendering a flawless, step-by-step visual animation.

---

## 💻 Tech Stack

* **Frontend:** Next.js (React), TypeScript, Tailwind CSS
* **Animations:** Framer Motion, GSAP, React Three Fiber (for 3D visuals)
* **Backend:** Python (FastAPI) for AI processing and code execution sandbox
* **AI/LLM:** LangChain, Qwen / OpenAI APIs for code-to-animation translation
* **Database:** PostgreSQL (via Supabase) for user data and problem storage

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* pnpm or npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ius-sharma/Leet-Love
   cd leetlove
   ```

2. **Setup Frontend:**
   ```bash
   cd frontend
   pnpm install
   pnpm run dev
   ```

3. **Setup Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Environment Variables:**
   Create a `.env` file in both frontend and backend directories and add your API keys (OpenAI/Qwen, Supabase, etc.).

---

## 🗺️ Roadmap

- [x] Core UI and Interactive Animation Templates (Array, Pointers).
- [ ] Top 50 LeetCode Problems with Story-driven manual animations.
- [ ] Backend Sandbox for safe user code execution.
- [ ] AI Pipeline for Auto-Animation generation (Beta).
- [ ] Multiplayer mode: Solve and visualize problems with friends in real-time.
- [ ] Mobile App (React Native) for learning on the go.

---

## 🤝 Contributing

We love contributions! Whether it's adding a new story, improving an animation, or fixing a bug, your help is welcome.

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request!

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <b>Made with ❤️ for developers who want to fall in love with DSA.</b>
  <br>
  <i>LeetLove - Because algorithms should be seen, not just read.</i>
</div>