// --- 1. KHỞI TẠO VÀ KIỂM TRA ĐĂNG NHẬP CŨ ---
window.onload = function() {
    const savedUser = localStorage.getItem("remembered_username");
    if (savedUser) {
        document.getElementById("username").value = savedUser;
        document.getElementById("remember").checked = true;
    }
    renderTimeline();
}

function handleLogin() {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value;
    const isRemember = document.getElementById("remember").checked;

    if (user !== "" && pass !== "") {
        if (isRemember) {
            localStorage.setItem("remembered_username", user);
        } else {
            localStorage.removeItem("remembered_username");
        }

        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("main-app").classList.remove("hidden");
        
        // Bật camera khi đăng nhập thành công
        openCamera();
    } else {
        alert("Vui lòng nhập tên tài khoản và mật khẩu!");
    }
}

// --- 2. XỬ LÝ CAMERA, XOAY VÀ TẮT/MỞ CAMERA ---
let activeStream = null;
let currentFacingMode = "user"; 
let isCamOn = true; // Theo dõi trạng thái camera

async function openCamera() {
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
    }

    // Kiểm tra xem trình duyệt có hỗ trợ camera không
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("Trình duyệt không hỗ trợ Camera.");
        return;
    }

    try {
        const constraints = {
            video: { facingMode: currentFacingMode }
        };
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById("webcam");
        if (video) {
            video.srcObject = activeStream;
        }
        
        // Cập nhật lại trạng thái nút bấm
        const toggleBtn = document.getElementById("toggle-cam-btn");
        if (toggleBtn) {
            toggleBtn.innerText = "🔴 Tắt Cam";
            toggleBtn.classList.remove("cam-off");
        }
        isCamOn = true;
    } catch (error) {
        console.log("Lỗi khởi động camera hoặc chưa cấp quyền:", error);
        // Không hiện alert liên tục để tránh treo app, chỉ ghi nhận lỗi ở Console
    }
}

function flipCamera() {
    if (!isCamOn) {
        alert("Vui lòng bật camera lên trước khi xoay!");
        return;
    }
    currentFacingMode = (currentFacingMode === "user") ? "environment" : "user";
    openCamera();
}

// Hàm tắt/mở camera chuẩn hóa
function toggleCamera() {
    const toggleBtn = document.getElementById("toggle-cam-btn");
    const video = document.getElementById("webcam");

    if (!toggleBtn || !video) return;

    if (isCamOn) {
        // TẮT CAMERA
        if (activeStream) {
            activeStream.getTracks().forEach(track => track.stop());
            activeStream = null;
        }
        video.srcObject = null; 
        
        toggleBtn.innerText = "🟢 Bật Cam";
        toggleBtn.classList.add("cam-off");
        isCamOn = false;
    } else {
        // BẬT CAMERA
        openCamera();
    }
}

// --- 3. CHỤP ẢNH TỪ CAMERA ---
function takePhoto() {
    const video = document.getElementById("webcam");
    if(!video || !video.srcObject || !isCamOn) {
        alert("Camera đang tắt hoặc chưa sẵn sàng! Bạn hãy dùng tính năng Up ảnh từ thư viện nhé.");
        return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    
    const base64Image = canvas.toDataURL("image/jpeg");
    promptFeedbackAndSave(base64Image);
}

// --- 4. UPLOAD ẢNH TỪ THƯ VIỆN ---
function uploadPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            promptFeedbackAndSave(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// --- 5. HỎI FEEDBACK VÀ LƯU ẢNH VĨNH VIỄN ---
function promptFeedbackAndSave(imageSrc) {
    const feedback = prompt("Thêm dòng suy nghĩ của bạn (Ví dụ: Hôm nay trời mưa 🌧️):");
    if (feedback !== null) { 
        const newPost = {
            id: Date.now(), 
            image: imageSrc,
            caption: feedback.trim() === "" ? "Khoảnh khắc không lời..." : feedback
        };

        let dbPhotos = JSON.parse(localStorage.getItem("my_locket_database")) || [];
        dbPhotos.unshift(newPost);
        localStorage.setItem("my_locket_database", JSON.stringify(dbPhotos));

        renderTimeline();
    }
}

// --- 6. HIỂN THỊ DANH SÁCH ẢNH LÊN MÀN HÌNH ---
function renderTimeline() {
    const timeline = document.getElementById("timeline");
    if (!timeline) return; 
    
    timeline.innerHTML = ""; 

    const dbPhotos = JSON.parse(localStorage.getItem("my_locket_database")) || [];

    dbPhotos.forEach(item => {
        const card = document.createElement("div");
        card.className = "photo-card";
        card.innerHTML = `
            <img src="${item.image}" alt="Locket Photo">
            <div class="photo-caption">${item.caption}</div>
            <button class="three-dots-menu" onclick="deletePhoto(${item.id})">⋮</button>
        `;
        timeline.appendChild(card);
    });
}

// --- 7. XỬ LÝ XÓA ẢNH ---
function deletePhoto(id) {
    if (confirm("Bạn có chắc chắn muốn xoá vĩnh viễn khoảnh khắc này không?")) {
        let dbPhotos = JSON.parse(localStorage.getItem("my_locket_database")) || [];
        dbPhotos = dbPhotos.filter(item => item.id !== id);
        localStorage.setItem("my_locket_database", JSON.stringify(dbPhotos));
        
        renderTimeline();
    }
}