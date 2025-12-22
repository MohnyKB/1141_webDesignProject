// src/useCloud.js
import { ref } from 'vue';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

// === 1. 新增：清洗資料的工具函式 ===
// 這個函式會遞迴檢查物件，把 undefined 的 expanded 補成 false，並移除其他 undefined 欄位
const sanitizeProjectData = (obj) => {
  // 如果是陣列，對每個元素做遞迴
  if (Array.isArray(obj)) {
    return obj.map(v => sanitizeProjectData(v));
  } 
  // 如果是物件 (且不是 null)
  else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      let value = obj[key];

      // --- 修復 Bug 的關鍵邏輯 ---
      // 如果欄位是 'expanded' 且值是 undefined，強制設定為 false (收合狀態)
      if (key === 'expanded' && value === undefined) {
        value = false;
      }

      // 繼續遞迴處理子屬性
      const cleanValue = sanitizeProjectData(value);

      // 只有當值不是 undefined 時，才放進回傳的物件中
      // (這樣可以避免 Firestore 報錯 "Unsupported field value: undefined")
      if (cleanValue !== undefined) {
        acc[key] = cleanValue;
      }
      return acc;
    }, {});
  }
  // 基本型別直接回傳
  return obj;
};

export function useCloud() {
  const publicProjects = ref([]);
  const myProjects = ref([]);
  const isLoading = ref(false);

  // 2. 儲存專案 (Create/Update)
  async function saveToCloud(projectData, title, description, isPublic) {
    if (!auth.currentUser) return alert("請先登入！");
    isLoading.value = true;
    
    try {
      // --- 修改處：在上傳前先清洗 projectData ---
      console.log("正在清洗資料以修復 undefined 錯誤...");
      const cleanContent = sanitizeProjectData(projectData);

      const docRef = await addDoc(collection(db, "projects"), {
        title,
        description,
        isPublic,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Anonymous",
        content: cleanContent, // 使用清洗後的資料
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert("儲存成功！");
      fetchMyProjects(); // 更新列表
    } catch (e) {
      console.error("Error adding document: ", e);
      // 印出更多資訊方便除錯
      console.log("原始資料:", projectData); 
      alert("儲存失敗: " + e.message);
    } finally {
      isLoading.value = false;
    }
  }

  // 3. 讀取工作坊專案 (Workshop - Read Public)
  async function fetchPublicProjects() {
    isLoading.value = true;
    try {
      const q = query(
        collection(db, "projects"), 
        where("isPublic", "==", true),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      publicProjects.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error(e);
    } finally {
      isLoading.value = false;
    }
  }

  // 4. 讀取我的專案 (Read Own)
  async function fetchMyProjects() {
    if (!auth.currentUser) return;
    isLoading.value = true;
    try {
      const q = query(
        collection(db, "projects"), 
        where("authorId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      myProjects.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.error(e);
    } finally {
      isLoading.value = false;
    }
  }

  // 5. 刪除專案 (Delete)
  async function deleteProject(id) {
    if (!confirm("確定要刪除嗎？")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      myProjects.value = myProjects.value.filter(p => p.id !== id);
    } catch (e) {
      console.error(e);
      alert("刪除失敗");
    }
  }

  return {
    publicProjects,
    myProjects,
    isLoading,
    saveToCloud,
    fetchPublicProjects,
    fetchMyProjects,
    deleteProject
  };
}