import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { useParams } from "react-router-dom";
import "./admin.css";
import { getStreamUrl, addWeek, addDay, getCourses, getPresignUrl, deleteContent, deleteWeekApi, deleteDayApi, saveContent, updateContentTitle, initiateMultipartUpload, getPresignedPartUrl, completeMultipartUpload, abortMultipartUpload, createVideoUploadSession, initiateGumletMultipart, signGumletPart, completeGumletMultipart } from "../../Api/api";

const GUMLET_PLAYER_DOMAIN = import.meta.env.VITE_GUMLET_PLAYER_DOMAIN || "play.gumlet.io";

const CourseContentManager = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [weekNumber, setWeekNumber] = useState("");
  const [weekTitle, setWeekTitle] = useState("");
  const [file, setFile] = useState(null);
  const [activeWeekId, setActiveWeekId] = useState(null);
  const [activeDayId, setActiveDayId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [error, setError] = useState(null);

  // Upload queue
  const [uploadQueue, setUploadQueue] = useState([]);
  const isProcessingRef = useRef(false);
  const queueRef = useRef([]);
  const wakeLockRef = useRef(null);
  const [interruptedUploads, setInterruptedUploads] = useState([]);

  // State for editing content title
  const [editingContentId, setEditingContentId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [updatingTitle, setUpdatingTitle] = useState(false);

  // Popup modal state
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editContext, setEditContext] = useState({ weekId: null, dayId: null, contentId: null });

  // Delete confirmation popup state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteContext, setDeleteContext] = useState({ weekId: null, dayId: null, contentId: null });


  const fetchCourse = async () => {
    try {
      const { data } = await getCourses(id);
      // console.log('📚 Fetched course data:', data);
      
      // Check if course uses shared content
      if (data.sharedContentId) {
        // console.log('🔗 Course uses shared content:', data.sharedContent?.name);
        // console.log('📖 Weeks from shared content:', data.weeks?.length || 0);
      } else {
        // console.log('📖 Course has direct content, weeks:', data.weeks?.length || 0);
      }
      
      setCourse(data);
    } catch (err) {
      setError("Failed to fetch course details");
      console.error(err);
    }
  };


  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleAddWeek = async () => {
    if (!weekNumber || !weekTitle) {
      setError("Please provide both week number and title");
      return;
    }

    try {
      setError(null);
      await addWeek(id, weekNumber, weekTitle); // from api.js
      setWeekNumber("");
      setWeekTitle("");
      fetchCourse();
    } catch (err) {
      setError("Failed to add week");
      console.error(err);
    }
  };

  const handleAddDay = async (weekId) => {
    try {
      setError(null);
      await addDay(id, weekId); // from api.js
      fetchCourse();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
      successDiv.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>
        New day has been successfully added to the week.
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
      `;
      document.querySelector('.container-fluid').insertBefore(successDiv, document.querySelector('.container-fluid').children[2]);
      setTimeout(() => successDiv.remove(), 5000);
    } catch (err) {
      setError("Failed to add day");
      console.error(err);
    }
  };


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (max 100MB for videos, 10MB for documents)

      // Validate file type
      const allowedTypes = activeType === "video"
        ? ["video/mp4", "video/webm", "video/mov", "video/avi"]
        : ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError(`Invalid file type. Allowed: ${activeType === "video" ? "MP4, WebM, MOV, AVI" : "PDF, DOC, DOCX"}`);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  // ── Check localStorage for interrupted uploads on mount ─────────────────────
  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('gumlet_resume_'));
    const interrupted = keys.map(key => {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    }).filter(Boolean);
    setInterruptedUploads(interrupted);
  }, []);

  // ── localStorage helpers ─────────────────────────────────────────────────────
  const getStorageKey = (file, weekNumber, dayNumber) =>
    `gumlet_resume_${file.name}_${file.size}_w${weekNumber}_d${dayNumber}`;

  const saveUploadProgress = (storageKey, data) => {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  };

  const clearUploadProgress = (storageKey) => {
    localStorage.removeItem(storageKey);
    setInterruptedUploads(prev => prev.filter(u => u.storageKey !== storageKey));
  };

  // ── Wake Lock ────────────────────────────────────────────────────────────────
  const acquireWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (e) {
        console.warn('Wake Lock unavailable:', e.message);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  // ── Keep queueRef in sync with state so async functions always read latest ──
  useEffect(() => {
    queueRef.current = uploadQueue;
  }, [uploadQueue]);

  // ── Core upload logic (no React state, just returns result) ─────────────────
  const doUpload = async (item, onProgress) => {
    const { file, weekNumber, dayNumber, type } = item;

    if (type === "video") {
      const VIDEO_MULTIPART_THRESHOLD = 100 * 1024 * 1024;

      if (file.size > VIDEO_MULTIPART_THRESHOLD) {
        const PART_SIZE = 25 * 1024 * 1024;
        const numParts = Math.ceil(file.size / PART_SIZE);
        const CONCURRENT_UPLOADS = 8;
        const storageKey = getStorageKey(file, weekNumber, dayNumber);

        // ── Resume check ──────────────────────────────────────────────────────
        const saved = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();
        let asset_id;
        let uploadedParts = [];

        if (saved?.asset_id && Array.isArray(saved.uploadedParts) && saved.uploadedParts.length > 0) {
          asset_id = saved.asset_id;
          uploadedParts = saved.uploadedParts;
          console.log(`Resuming upload: ${uploadedParts.length}/${numParts} parts already done`);
        } else {
          const initiateRes = await initiateGumletMultipart();
          asset_id = initiateRes.data.asset_id;
          if (!asset_id) throw new Error("Failed to initiate Gumlet multipart upload");
          saveUploadProgress(storageKey, { storageKey, asset_id, uploadedParts: [], fileName: file.name, fileSize: file.size, weekNumber, dayNumber });
        }

        const completedPartNumbers = new Set(uploadedParts.map(p => p.PartNumber));

        for (let batchStart = 1; batchStart <= numParts; batchStart += CONCURRENT_UPLOADS) {
          const batchEnd = Math.min(batchStart + CONCURRENT_UPLOADS - 1, numParts);

          // Only upload parts not yet completed
          const pendingParts = [];
          for (let p = batchStart; p <= batchEnd; p++) {
            if (!completedPartNumbers.has(p)) pendingParts.push(p);
          }

          if (pendingParts.length > 0) {
            const batchResults = await Promise.all(pendingParts.map(partNumber => (async () => {
              const start = (partNumber - 1) * PART_SIZE;
              const end = Math.min(start + PART_SIZE, file.size);
              const partBlob = file.slice(start, end);
              let retries = 3;
              let ETag = null;
              while (retries > 0) {
                try {
                  const signRes = await signGumletPart(asset_id, partNumber);
                  const { part_upload_url } = signRes.data;
                  const xhr = await new Promise((resolve, reject) => {
                    const x = new XMLHttpRequest();
                    x.open("PUT", part_upload_url);
                    x.onload = () => (x.status === 200 ? resolve(x) : reject(new Error(`Part ${partNumber} failed: ${x.status}`)));
                    x.onerror = () => reject(new Error(`Part ${partNumber} network error`));
                    x.send(partBlob);
                  });
                  ETag = xhr.getResponseHeader("ETag");
                  if (!ETag) throw new Error("No ETag received");
                  break;
                } catch (err) {
                  retries--;
                  if (retries === 0) throw new Error(`Part ${partNumber} failed after 3 attempts: ${err.message}`);
                  await new Promise(r => setTimeout(r, (4 - retries) * 1000));
                }
              }
              return { PartNumber: partNumber, ETag };
            })()));

            batchResults.forEach(r => {
              uploadedParts.push(r);
              completedPartNumbers.add(r.PartNumber);
            });

            // Save progress after every batch
            saveUploadProgress(storageKey, { storageKey, asset_id, uploadedParts, fileName: file.name, fileSize: file.size, weekNumber, dayNumber });
          }

          onProgress(Math.min(Math.round((batchEnd / numParts) * 100), 99));
        }

        uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
        await completeGumletMultipart(asset_id, uploadedParts);
        clearUploadProgress(storageKey); // ✅ clear on success
        onProgress(100);
        return { asset_id };

      } else {
        const uploadSessionRes = await createVideoUploadSession();
        const { upload_url, asset_id } = uploadSessionRes.data;
        if (!upload_url || !asset_id) throw new Error("Failed to create video upload session");

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
          });
          xhr.addEventListener("load", () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
        return { asset_id };
      }

    } else {
      const folder = "documents";
      const MULTIPART_THRESHOLD = 100 * 1024 * 1024;

      if (file.size > MULTIPART_THRESHOLD) {
        const initiateRes = await initiateMultipartUpload(file.name, file.type, folder, weekNumber, dayNumber);
        const uploadId = initiateRes.data.uploadId;
        const key = initiateRes.data.key;

        try {
          const PART_SIZE = 10 * 1024 * 1024;
          const numParts = Math.ceil(file.size / PART_SIZE);
          const uploadedParts = [];
          const CONCURRENT_UPLOADS = 5;
          const startTime = Date.now();
          let uploadedBytes = 0;

          for (let batchStart = 1; batchStart <= numParts; batchStart += CONCURRENT_UPLOADS) {
            const batchEnd = Math.min(batchStart + CONCURRENT_UPLOADS - 1, numParts);
            const batchPromises = [];

            for (let partNumber = batchStart; partNumber <= batchEnd; partNumber++) {
              const start = (partNumber - 1) * PART_SIZE;
              const end = Math.min(start + PART_SIZE, file.size);
              const partBlob = file.slice(start, end);

              batchPromises.push((async () => {
                let retries = 3;
                let etag = null;
                while (retries > 0) {
                  try {
                    const partUrlRes = await getPresignedPartUrl(key, uploadId, partNumber);
                    const partUploadUrl = partUrlRes.data.uploadUrl;
                    const response = await new Promise((resolve, reject) => {
                      const xhr = new XMLHttpRequest();
                      xhr.open('PUT', partUploadUrl);
                      xhr.setRequestHeader('Content-Type', file.type);
                      xhr.onload = () => xhr.status === 200 ? resolve(xhr) : reject(new Error(`Part ${partNumber} failed: ${xhr.status}`));
                      xhr.onerror = () => reject(new Error(`Part ${partNumber} network error`));
                      xhr.send(partBlob);
                    });
                    etag = response.getResponseHeader('ETag');
                    if (!etag) throw new Error('No ETag received');
                    break;
                  } catch (error) {
                    retries--;
                    if (retries === 0) throw new Error(`Part ${partNumber} failed after 3 attempts: ${error.message}`);
                    await new Promise(r => setTimeout(r, (4 - retries) * 1000));
                  }
                }
                return { partNumber, etag };
              })());
            }

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(({ partNumber, etag }) => {
              uploadedParts.push({ PartNumber: partNumber, ETag: etag });
              uploadedBytes += PART_SIZE;
            });

            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const speedMBps = (uploadedBytes / 1024 / 1024) / elapsedSeconds;
            const remainingBytes = file.size - uploadedBytes;
            const etaMinutes = Math.round((remainingBytes / (uploadedBytes / elapsedSeconds)) / 60);
            onProgress(Math.round((batchEnd / numParts) * 100));
            console.log(`✅ Parts ${batchStart}-${batchEnd}/${numParts} | Speed: ${speedMBps.toFixed(2)} MB/s | ETA: ${etaMinutes}min`);
          }

          uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
          await completeMultipartUpload(key, uploadId, uploadedParts);
          return { s3Key: key };

        } catch (err) {
          await abortMultipartUpload(key, uploadId);
          throw err;
        }

      } else {
        const presignRes = await getPresignUrl(file.name, file.type, folder, weekNumber, dayNumber);
        const uploadUrl = presignRes.data.uploadUrl;
        const key = presignRes.data.key;

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
          });
          xhr.addEventListener('load', () => xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
          xhr.addEventListener('error', () => reject(new Error('Upload failed')));
          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });
        return { s3Key: key };
      }
    }
  };

  // ── Process the next pending item in the queue ───────────────────────────────
  const processNextItem = async () => {
    if (isProcessingRef.current) return;

    const nextItem = queueRef.current.find(item => item.status === 'pending');
    if (!nextItem) return;

    isProcessingRef.current = true;
    await acquireWakeLock();

    setUploadQueue(prev => prev.map(item =>
      item.id === nextItem.id ? { ...item, status: 'uploading', progress: 0 } : item
    ));

    try {
      const result = await doUpload(nextItem, (progress) => {
        setUploadQueue(prev => prev.map(item =>
          item.id === nextItem.id ? { ...item, progress } : item
        ));
      });

      const title = nextItem.type === 'video'
        ? `Week ${nextItem.weekNumber} - Day ${nextItem.dayNumber} - ${nextItem.file.name.replace(/\.[^.]+$/, '')}`
        : nextItem.file.name.replace(/\.[^.]+$/, '');

      await saveContent(id, nextItem.weekId, nextItem.dayId, {
        type: nextItem.type,
        title,
        ...(nextItem.type === 'video' ? { asset_id: result.asset_id } : { s3Key: result.s3Key }),
      });

      fetchCourse();

      setUploadQueue(prev => prev.map(item =>
        item.id === nextItem.id ? { ...item, status: 'done', progress: 100 } : item
      ));

    } catch (err) {
      console.error("Queue upload failed:", err);
      // Clear localStorage on error so a retry starts fresh
      if (nextItem.type === 'video') {
        clearUploadProgress(getStorageKey(nextItem.file, nextItem.weekNumber, nextItem.dayNumber));
      }
      setUploadQueue(prev => prev.map(item =>
        item.id === nextItem.id ? { ...item, status: 'error', error: err.message } : item
      ));
    } finally {
      isProcessingRef.current = false;
      // Release wake lock only when no more pending items
      const nextPending = queueRef.current.find(item => item.status === 'pending');
      if (nextPending) {
        processNextItem();
      } else {
        await releaseWakeLock();
      }
    }
  };

  // ── Add file to queue and reset form ────────────────────────────────────────
  const addToQueue = () => {
    if (!file || !activeWeekId || !activeDayId || !activeType) return;

    const activeWeek = course.weeks.find(w => w._id === activeWeekId);
    const activeDay = activeWeek?.days.find(d => d._id === activeDayId);
    if (!activeWeek || !activeDay) return;

    const newItem = {
      id: Date.now() + Math.random(),
      file,
      weekId: activeWeekId,
      dayId: activeDayId,
      weekNumber: activeWeek.weekNumber,
      dayNumber: activeDay.dayNumber,
      type: activeType,
      status: 'pending',
      progress: 0,
      error: null,
    };

    setUploadQueue(prev => [...prev, newItem]);
    setFile(null);
    setActiveWeekId(null);
    setActiveDayId(null);
    setActiveType(null);
    document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
  };

  // ── Kick queue whenever a new item is added ──────────────────────────────────
  useEffect(() => {
    if (!isProcessingRef.current && uploadQueue.some(item => item.status === 'pending')) {
      processNextItem();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadQueue.length]);

  const handleDeleteContent = (weekId, dayId, contentId) => {
    setDeleteContext({ weekId, dayId, contentId });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteContent = async () => {
    const { weekId, dayId, contentId } = deleteContext;
    setShowDeleteConfirm(false);
    try {
      await deleteContent(id, weekId, dayId, contentId);
      fetchCourse();
    } catch (err) {
      setError("Failed to delete content");
      console.error(err);
    }
  };

  const handleEditTitle = (weekId, dayId, contentId, currentTitle) => {
    setShowEditPopup(false);
    setEditingContentId(null);
    setEditingTitle(currentTitle);
  };
  const handleEditTitlePopup = (weekId, dayId, contentId, currentTitle) => {
    setEditContext({ weekId, dayId, contentId });
    setEditingTitle(currentTitle);
    setShowEditPopup(true);
  };


  const handleSaveTitle = async (weekId, dayId, contentId) => {
    if (!editingTitle.trim()) {
      setError("Title cannot be empty");
      return;
    }

    setUpdatingTitle(true);
    try {
      await updateContentTitle(id, weekId, dayId, contentId, editingTitle);
      setShowEditPopup(false);
      setEditingContentId(null);
      setEditingTitle("");
      fetchCourse();
    } catch (err) {
      setError("Failed to update content title");
      console.error(err);
    } finally {
      setUpdatingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditPopup(false);
    setEditingContentId(null);
    setEditingTitle("");
  };


  const deleteWeek = async (weekId) => {
    const week = course.weeks.find(w => w._id === weekId);
    const totalContent = week?.days?.reduce((total, day) => total + (day.contents?.length || 0), 0) || 0;

    const confirmMessage = `Are you sure you want to delete Module ${week?.weekNumber}?\n\nThis will permanently delete:\n• All 7 days in this week\n• ${totalContent} content items (videos/documents)\n• All associated files from cloud storage\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      setError(null);
      await deleteWeekApi(id, weekId); // use centralized API

      // Reset active selections if they belonged to the deleted week
      if (activeWeekId === weekId) {
        setActiveWeekId(null);
        setActiveDayId(null);
        setActiveType(null);
        setFile(null);
      }

      fetchCourse();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
      successDiv.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>
      Week ${week?.weekNumber} has been successfully deleted.
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
      document.querySelector('.container-fluid').insertBefore(successDiv, document.querySelector('.container-fluid').children[2]);
      setTimeout(() => successDiv.remove(), 5000);

    } catch (err) {
      setError("Failed to delete week");
      console.error(err);
    }
  };


  const deleteDay = async (weekId, dayId) => {
    const week = course.weeks.find(w => w._id === weekId);
    const day = week?.days.find(d => d._id === dayId);
    const contentCount = day?.contents?.length || 0;

    const confirmMessage = `Are you sure you want to delete Day ${day?.dayNumber}?\n\nThis will permanently delete:\n• ${contentCount} content items (videos/documents)\n• All associated files from cloud storage\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      setError(null);
      await deleteDayApi(id, weekId, dayId); // centralized API call

      // Reset active selections if they belonged to the deleted day
      if (activeWeekId === weekId && activeDayId === dayId) {
        setActiveDayId(null);
        setActiveType(null);
        setFile(null);
      }

      fetchCourse();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
      successDiv.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>
      Day ${day?.dayNumber} has been successfully deleted.
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
      document.querySelector('.container-fluid').insertBefore(successDiv, document.querySelector('.container-fluid').children[2]);
      setTimeout(() => successDiv.remove(), 5000);

    } catch (err) {
      setError("Failed to delete day");
      console.error(err);
    }
  };

  // REMOVED: addToUploadQueue (replaced by addToQueue above)
  const _placeholder_addToUploadQueue = async () => {
    if (!file || !activeWeekId || !activeDayId || !activeType) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Find the active week and day to get their numbers
      const activeWeek = course.weeks.find(week => week._id === activeWeekId);
      const activeDay = activeWeek?.days.find(day => day._id === activeDayId);

      if (!activeWeek || !activeDay) {
        throw new Error("Could not find selected week or day");
      }

      console.log(`Uploading to Week ${activeWeek.weekNumber}, Day ${activeDay.dayNumber}`);

      let key;
      let assetId;

      if (activeType === "video") {
        const VIDEO_MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MB

        if (file.size > VIDEO_MULTIPART_THRESHOLD) {
          // ── Gumlet multipart upload ──────────────────────────────────────
          const initiateRes = await initiateGumletMultipart();
          const { asset_id } = initiateRes.data;

          if (!asset_id) {
            throw new Error("Failed to initiate Gumlet multipart upload");
          }

          const PART_SIZE = 10 * 1024 * 1024; // 10 MB per part (min 5 MB for Gumlet)
          const numParts = Math.ceil(file.size / PART_SIZE);
          const uploadedParts = [];
          const CONCURRENT_UPLOADS = 4;
          let uploadedBytes = 0;

          try {
            for (let batchStart = 1; batchStart <= numParts; batchStart += CONCURRENT_UPLOADS) {
              const batchEnd = Math.min(batchStart + CONCURRENT_UPLOADS - 1, numParts);
              const batchPromises = [];

              for (let partNumber = batchStart; partNumber <= batchEnd; partNumber++) {
                const start = (partNumber - 1) * PART_SIZE;
                const end = Math.min(start + PART_SIZE, file.size);
                const partBlob = file.slice(start, end);

                const uploadPromise = (async () => {
                  let retries = 3;
                  let ETag = null;

                  while (retries > 0) {
                    try {
                      const signRes = await signGumletPart(asset_id, partNumber);
                      const { part_upload_url } = signRes.data;

                      const xhr = await new Promise((resolve, reject) => {
                        const x = new XMLHttpRequest();
                        x.open("PUT", part_upload_url);
                        x.onload = () => (x.status === 200 ? resolve(x) : reject(new Error(`Part ${partNumber} failed: ${x.status}`)));
                        x.onerror = () => reject(new Error(`Part ${partNumber} network error`));
                        x.send(partBlob);
                      });

                      ETag = xhr.getResponseHeader("ETag");
                      if (!ETag) throw new Error("No ETag received");
                      break;
                    } catch (err) {
                      retries--;
                      if (retries === 0) throw new Error(`Part ${partNumber} failed after 3 attempts: ${err.message}`);
                      await new Promise(r => setTimeout(r, (4 - retries) * 1000));
                    }
                  }

                  return { PartNumber: partNumber, ETag };
                })();

                batchPromises.push(uploadPromise);
              }

              const batchResults = await Promise.all(batchPromises);
              batchResults.forEach(({ PartNumber, ETag }) => {
                uploadedParts.push({ PartNumber, ETag });
                uploadedBytes += PART_SIZE;
              });

              const progress = Math.round((batchEnd / numParts) * 100);
              setUploadProgress(Math.min(progress, 99));
            }

            uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
            await completeGumletMultipart(asset_id, uploadedParts);
            setUploadProgress(100);

          } catch (err) {
            throw err;
          }

          assetId = asset_id;

        } else {
          // ── Single PUT for small videos (<= 100 MB) ──────────────────────
          const uploadSessionRes = await createVideoUploadSession();
          const { upload_url, asset_id } = uploadSessionRes.data;

          if (!upload_url || !asset_id) {
            throw new Error("Failed to create video upload session");
          }

          const xhr = new XMLHttpRequest();
          await new Promise((resolve, reject) => {
            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                setUploadProgress(Math.round((e.loaded / e.total) * 100));
              }
            });
            xhr.addEventListener("load", () => {
              xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
            });
            xhr.addEventListener("error", () => reject(new Error("Upload failed")));
            xhr.open("PUT", upload_url);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);
          });

          assetId = asset_id;
        }
      } else {
        const folder = "documents";
        const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold for multipart upload

        // Use multipart upload for files larger than 100MB
        if (file.size > MULTIPART_THRESHOLD) {
        // console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB - Using multipart upload`);
        
        // 1. Initiate multipart upload
        const initiateRes = await initiateMultipartUpload(
          file.name,
          file.type,
          folder,
          activeWeek.weekNumber,
          activeDay.dayNumber
        );
        
        const uploadId = initiateRes.data.uploadId;
        key = initiateRes.data.key;
        // console.log("Multipart upload initiated:", { uploadId, key });

        try {
          // 2. Upload file in parts (10MB chunks for faster uploads)
          const PART_SIZE = 10 * 1024 * 1024; // 10MB per part (optimized for 10GB+ files)
          const numParts = Math.ceil(file.size / PART_SIZE);
          const uploadedParts = [];
          const CONCURRENT_UPLOADS = 5; // Upload 5 parts in parallel
          const startTime = Date.now();
          let uploadedBytes = 0;

          // Upload parts in batches for speed
          for (let batchStart = 1; batchStart <= numParts; batchStart += CONCURRENT_UPLOADS) {
            const batchEnd = Math.min(batchStart + CONCURRENT_UPLOADS - 1, numParts);
            const batchPromises = [];
            
            for (let partNumber = batchStart; partNumber <= batchEnd; partNumber++) {
              const start = (partNumber - 1) * PART_SIZE;
              const end = Math.min(start + PART_SIZE, file.size);
              const partBlob = file.slice(start, end);

              // Create upload promise for this part
              const uploadPromise = (async () => {
                // Retry logic for each part (max 3 attempts)
                let retries = 3;
                let etag = null;
                
                while (retries > 0) {
                  try {
                    // Get presigned URL for this part
                    const partUrlRes = await getPresignedPartUrl(key, uploadId, partNumber);
                    const partUploadUrl = partUrlRes.data.uploadUrl;

                    // Upload part with XMLHttpRequest for better control
                    const response = await new Promise((resolve, reject) => {
                      const xhr = new XMLHttpRequest();
                      
                      xhr.open('PUT', partUploadUrl);
                      xhr.setRequestHeader('Content-Type', file.type);
                      
                      xhr.onload = () => {
                        if (xhr.status === 200) {
                          resolve(xhr);
                        } else {
                          reject(new Error(`Part ${partNumber} upload failed with status: ${xhr.status}`));
                        }
                      };
                      
                      xhr.onerror = () => reject(new Error(`Part ${partNumber} network error`));
                      xhr.ontimeout = () => reject(new Error(`Part ${partNumber} timeout`));
                      
                      xhr.send(partBlob);
                    });

                    // Get ETag from response
                    etag = response.getResponseHeader('ETag');
                    if (!etag) {
                      throw new Error('No ETag received from server');
                    }
                    
                    break; // Success, exit retry loop
                  } catch (error) {
                    retries--;
                    console.warn(`Part ${partNumber} failed, retries left: ${retries}`, error);
                    if (retries === 0) {
                      throw new Error(`Part ${partNumber} failed after 3 attempts: ${error.message}`);
                    }
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
                  }
                }

                return { partNumber, etag };
              })();

              batchPromises.push(uploadPromise);
            }

            // Wait for all parts in this batch to complete
            const batchResults = await Promise.all(batchPromises);
            
            // Add completed parts to array
            batchResults.forEach(({ partNumber, etag }) => {
              uploadedParts.push({
                PartNumber: partNumber,
                ETag: etag,
              });
              uploadedBytes += PART_SIZE;
            });

            // Calculate and display upload speed
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const speedMBps = (uploadedBytes / 1024 / 1024) / elapsedSeconds;
            const remainingBytes = file.size - uploadedBytes;
            const etaSeconds = remainingBytes / (uploadedBytes / elapsedSeconds);
            const etaMinutes = Math.round(etaSeconds / 60);

            // Update progress with speed info
            const progress = Math.round((batchEnd / numParts) * 100);
            setUploadProgress(progress);
            console.log(`✅ Uploaded parts ${batchStart}-${batchEnd}/${numParts} (${progress}%) | Speed: ${speedMBps.toFixed(2)} MB/s | ETA: ${etaMinutes}min`);
          }

          // 3. Sort parts by part number and complete multipart upload
          uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
          await completeMultipartUpload(key, uploadId, uploadedParts);
          console.log("✅ Multipart upload completed successfully");

        } catch (err) {
          // Abort multipart upload on error
          console.error("Multipart upload failed, aborting:", err);
          await abortMultipartUpload(key, uploadId);
          throw err;
        }

        } else {
          // Use regular single-part upload for smaller files
          // console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB - Using single-part upload`);
          
          const presignRes = await getPresignUrl(
            file.name,
            file.type,
            folder,
            activeWeek.weekNumber,
            activeDay.dayNumber
          );

          const uploadUrl = presignRes.data.uploadUrl;
          key = presignRes.data.key;
          // console.log("Got presigned URL and key:", { uploadUrl, key });

          // Upload file to S3 with progress tracking
          const xhr = new XMLHttpRequest();

          await new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setUploadProgress(progress);
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status === 200) {
                resolve();
              } else {
                reject(new Error(`Upload failed with status: ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error('Upload failed'));
            });

            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
          });
        }
      }

      // 3. Add to uploaded files queue instead of saving immediately
      const uploadedFile = {
        id: Date.now() + Math.random(), // Temporary ID
        file: file,
        weekId: activeWeekId,
        dayId: activeDayId,
        weekNumber: activeWeek.weekNumber,
        dayNumber: activeDay.dayNumber,
        type: activeType,
        s3Key: key,
        asset_id: assetId,
        uploaded: true,
        saved: false
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Reset current file selection
      setFile(null);
      setActiveWeekId(null);
      setActiveDayId(null);
      setActiveType(null);
      setUploadProgress(0);

      // Clear file input
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');

    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };



  const cancelUpload = () => {
    setFile(null);
    setActiveWeekId(null);
    setActiveDayId(null);
    setActiveType(null);
    setError(null);
    document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
  };

  if (!course) return (
    <AdminLayout>
      <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="container-fluid">
        <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
          Manage "{course.title}" - Day-wise Content
        </h3>

        {/* Shared Content Warning */}
        {course.sharedContentId && (
          <div className="alert alert-info border-info mb-4" role="alert">
            <div className="d-flex align-items-start">
              <i className="bi bi-info-circle-fill me-2 mt-1" style={{ fontSize: "1.5rem" }}></i>
              <div>
                <h5 className="alert-heading mb-2">
                  <i className="bi bi-link-45deg me-1"></i>
                  This course uses shared content
                </h5>
                <p className="mb-2">
                  <strong>Shared Content:</strong> {course.sharedContent?.name}
                </p>
                <p className="mb-0">
                  This course's content is managed through shared content. Any changes to weeks, days, or content 
                  should be made in the <strong>Shared Content Manager</strong> to affect all linked courses.
                </p>
                <hr className="my-2" />
                <p className="mb-0 text-muted small">
                  <i className="bi bi-lightbulb me-1"></i>
                  <strong>Note:</strong> Editing here will only work if this course has its own direct content (not shared).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Interrupted Uploads Banner */}
        {interruptedUploads.length > 0 && (
          <div className="alert alert-warning border-warning mb-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong><i className="bi bi-exclamation-triangle me-2"></i>Interrupted Upload{interruptedUploads.length > 1 ? 's' : ''} Detected</strong>
                <p className="mb-2 mt-1 small">Re-add the file(s) below to resume from where they stopped:</p>
                {interruptedUploads.map((u, i) => (
                  <div key={i} className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-camera-video text-primary"></i>
                    <small>
                      <strong>{u.fileName}</strong> — Week {u.weekNumber} / Day {u.dayNumber}
                      <span className="text-muted ms-2">({u.uploadedParts?.length || 0} parts saved)</span>
                    </small>
                    <button
                      className="btn btn-outline-danger btn-sm py-0 px-1"
                      style={{ fontSize: "0.65rem" }}
                      onClick={() => clearUploadProgress(u.storageKey)}
                      title="Discard saved progress"
                    >
                      Discard
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upload Queue Panel */}
        {uploadQueue.length > 0 && (
          <div className="card mb-4 border-primary">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-list-task me-2"></i>
                Upload Queue ({uploadQueue.filter(i => i.status !== 'done').length} active / {uploadQueue.length} total)
              </h5>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => setUploadQueue(prev => prev.filter(i => i.status !== 'done'))}
              >
                <i className="bi bi-check2-all me-1"></i>
                Clear Done
              </button>
            </div>
            <div className="card-body py-2">
              {uploadQueue.map(item => (
                <div
                  key={item.id}
                  className={`d-flex align-items-center p-2 mb-2 rounded border ${
                    item.status === 'done'     ? 'border-success bg-success bg-opacity-10' :
                    item.status === 'error'    ? 'border-danger bg-danger bg-opacity-10' :
                    item.status === 'uploading'? 'border-primary bg-primary bg-opacity-10' :
                    'border-secondary'
                  }`}
                >
                  <i className={`bi me-2 ${item.type === 'video' ? 'bi-camera-video text-primary' : 'bi-file-earmark-pdf text-danger'}`}></i>
                  <div className="flex-grow-1 me-2" style={{ minWidth: 0 }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="fw-semibold text-truncate" style={{ maxWidth: '55%' }} title={item.file.name}>
                        {item.file.name}
                      </small>
                      <small className="text-muted text-nowrap ms-2">
                        W{item.weekNumber} / D{item.dayNumber} &bull; {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                      </small>
                    </div>
                    {item.status === 'uploading' && (
                      <div className="progress mt-1" style={{ height: '4px' }}>
                        <div
                          className="progress-bar progress-bar-striped progress-bar-animated"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    )}
                    {item.status === 'error' && (
                      <small className="text-danger d-block mt-1">{item.error}</small>
                    )}
                  </div>
                  <span className={`badge text-nowrap ms-1 ${
                    item.status === 'done'      ? 'bg-success' :
                    item.status === 'error'     ? 'bg-danger' :
                    item.status === 'uploading' ? 'bg-primary' :
                    'bg-secondary'
                  }`}>
                    {item.status === 'uploading' ? `${item.progress}%` : item.status}
                  </span>
                  {item.status === 'pending' && (
                    <button
                      className="btn btn-outline-danger btn-sm ms-2 p-0 px-1"
                      onClick={() => {
                        if (item.type === 'video') clearUploadProgress(getStorageKey(item.file, item.weekNumber, item.dayNumber));
                        setUploadQueue(prev => prev.filter(i => i.id !== item.id));
                      }}
                      title="Remove from queue"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Week Section */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Add New Module (7 Days Auto-Created)
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <label className="form-label">Module Number</label>
                <input
                  type="number"
                  placeholder="e.g., 1"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(e.target.value)}
                  className="form-control"
                  min="1"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Module Title</label>
                <input
                  type="text"
                  placeholder="e.g., Introduction to Anatomy"
                  value={weekTitle}
                  onChange={(e) => setWeekTitle(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  onClick={handleAddWeek}
                  className="btn btn-success w-100"
                  disabled={!weekNumber || !weekTitle}
                >
                  <i className="bi bi-plus"></i> Add Module
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Course Weeks */}
        {course.weeks && course.weeks.length > 0 ? (
          <div className="row">
            {course.weeks.map((week, weekIndex) => (
              <div key={week._id} className="col-12 mb-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center week-header">
                    <h5 className="mb-0">
                      <i className="bi bi-calendar-week me-2"></i>
                      Week {week.weekNumber}: {week.title}
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-dark">
                        {week.days?.length || 0} days
                      </span>
                      <span className="badge bg-info text-white">
                        {week.days?.reduce((total, day) => total + (day.contents?.length || 0), 0) || 0} items
                      </span>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleAddDay(week._id)}
                        title="Add New Day to this Week"
                      >
                        <i className="bi bi-plus-circle"></i> Add Day
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteWeek(week._id)}
                        title="Delete Entire Week"
                      >
                        <i className="bi bi-trash"></i> Delete Module
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {/* Days Grid */}
                    {week.days && week.days.length > 0 ? (
                      <div className="row">
                        {week.days.map((day, dayIndex) => (
                          <div key={day._id} className="col-md-6 col-lg-4 mb-4">
                            <div className="card h-100 border-2">
                              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <h6 className="mb-0 fw-bold">
                                  <i className="bi bi-calendar-day me-2"></i>
                                  Day {day.dayNumber}
                                </h6>
                                <div className="d-flex align-items-center gap-1">
                                  <span className="badge bg-secondary">
                                    {day.contents?.length || 0} items
                                  </span>
                                  <button
                                    className="btn btn-outline-danger btn-sm p-1"
                                    onClick={() => deleteDay(week._id, day._id)}
                                    title="Delete Day"
                                    style={{ fontSize: "0.7rem" }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </div>
                              <div className="card-body p-3">
                                <h6 className="text-muted small mb-2">{day.title}</h6>

                                {/* Day Content */}
                                {day.contents && day.contents.length > 0 ? (
                                  <div className="mb-3">
                                    {day.contents.map((content) => (
                                      <div key={content._id} className="mb-2 p-2 border rounded">
                                        {editingContentId === content._id ? (
                                          // Edit mode
                                          <div className="d-flex justify-content-between align-items-center mb-1">
                                            <small className="fw-semibold text-break" style={{ flex: 1, paddingRight: "8px" }}>
                                              <i className={`bi ${content.type === 'video' ? 'bi-play-circle text-primary' : 'bi-file-earmark-pdf text-info'} me-1`}></i>
                                              {content.title}
                                            </small>
                                            <div className="d-flex gap-1">
                                              <button
                                                className="btn btn-outline-primary btn-sm p-1"
                                                style={{ fontSize: "0.7rem" }}
                                                onClick={() => handleEditTitlePopup(week._id, day._id, content._id, content.title)}
                                                title="Edit title"
                                              >
                                                <i className="bi bi-pencil"></i>
                                              </button>
                                              <button
                                                className="btn btn-danger btn-sm p-1"
                                                style={{ fontSize: "0.7rem" }}
                                                onClick={() => handleDeleteContent(week._id, day._id, content._id)}
                                              >
                                                <i className="bi bi-trash"></i>
                                              </button>
                                            </div>
                                          </div>

                                        ) : (
                                          // View mode
                                          <div className="d-flex justify-content-between align-items-center mb-1">
                                            <small className="fw-semibold text-break" style={{ flex: 1, paddingRight: "8px" }}>
                                              <i className={`bi ${content.type === 'video' ? 'bi-play-circle text-primary' : 'bi-file-earmark-pdf text-info'} me-1`}></i>
                                              {content.title}
                                            </small>
                                            <div className="d-flex gap-1">
                                              <button
                                                className="btn btn-outline-primary btn-sm p-1"
                                                style={{ fontSize: "0.7rem" }}
                                                onClick={() => handleEditTitlePopup(week._id, day._id, content._id, content.title)}
                                                title="Edit title"
                                              >
                                                <i className="bi bi-pencil"></i>
                                              </button>
                                              <button
                                                className="btn btn-danger btn-sm p-1"
                                                style={{ fontSize: "0.7rem" }}
                                                onClick={() => handleDeleteContent(week._id, day._id, content._id)}
                                              >
                                                <i className="bi bi-trash"></i>
                                              </button>
                                            </div>
                                          </div>
                                        )}


                                        {content.type === "pdf" && (
                                          <a
                                            href={getStreamUrl(content.s3Key)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-info btn-sm w-100"
                                            style={{ fontSize: "0.7rem" }}
                                          >
                                            <i className="bi bi-eye me-1"></i>
                                            View PDF
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted small mb-3">No content yet</p>
                                )}

                                {/* Upload Section for Each Day */}
                                <div className="border-top pt-2">
                                  <small className="text-muted d-block mb-2">Add content:</small>

                                  {/* Upload Type Buttons */}
                                  <div className="d-flex gap-1 mb-2">
                                    <button
                                      className={`btn btn-sm ${activeWeekId === week._id && activeDayId === day._id && activeType === "video" ? "btn-primary" : "btn-outline-primary"}`}
                                      onClick={() => {
                                        setActiveWeekId(week._id);
                                        setActiveDayId(day._id);
                                        setActiveType("video");
                                        setFile(null);
                                        setError(null);
                                      }}
                                      disabled={false}
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      <i className="bi bi-camera-video me-1"></i>
                                      Video
                                    </button>
                                    <button
                                      className={`btn btn-sm ${activeWeekId === week._id && activeDayId === day._id && activeType === "pdf" ? "btn-info" : "btn-outline-info"}`}
                                      onClick={() => {
                                        setActiveWeekId(week._id);
                                        setActiveDayId(day._id);
                                        setActiveType("pdf");
                                        setFile(null);
                                        setError(null);
                                      }}
                                      disabled={false}
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      <i className="bi bi-file-earmark-pdf me-1"></i>
                                      Doc
                                    </button>
                                  </div>

                                  {/* File Input + inline upload UI (only show for active day) */}
                                  {activeWeekId === week._id && activeDayId === day._id && activeType && (
                                    <div className="mb-2">
                                      <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="form-control form-control-sm"
                                        accept={activeType === "video" ? "video/*" : ".pdf,.doc,.docx"}
                                        disabled={false}
                                        style={{ fontSize: "0.7rem" }}
                                      />
                                      <div className="form-text" style={{ fontSize: "0.6rem" }}>
                                        {activeType === "video" ? "MP4, WebM (any size — large files use multipart upload)" : "PDF, DOC (Max: 10MB)"}
                                      </div>

                                      {/* Inline upload confirmation */}
                                      {file && (
                                        <div className="mt-2 p-2 border border-success rounded bg-light">
                                          <div className="mb-2" style={{ fontSize: "0.7rem" }}>
                                            <strong>{file.name}</strong>
                                            <span className="text-muted ms-2">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                          </div>


                                          <div className="d-flex gap-1 flex-wrap">
                                            <button
                                              className="btn btn-success btn-sm"
                                              onClick={addToQueue}
                                              style={{ fontSize: "0.65rem" }}
                                            >
                                              <i className="bi bi-plus-circle me-1" />Add to Queue
                                            </button>
                                            <button
                                              className="btn btn-outline-secondary btn-sm"
                                              onClick={cancelUpload}
                                              style={{ fontSize: "0.65rem" }}
                                            >
                                              <i className="bi bi-x me-1" />Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <i className="bi bi-calendar-x display-6 text-muted"></i>
                        <p className="text-muted mt-2">No day configured for this Module</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x display-1 text-muted"></i>
            <h5 className="text-muted mt-3">No Modules added yet</h5>
            <p className="text-muted">Start by adding your first Module above.</p>
          </div>
        )}

      </div>
      {showEditPopup && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1050
          }}
        >
          <div className="card shadow-lg" style={{ width: "400px", borderRadius: "12px" }}>
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Edit Content Title
              </h6>
              <button
                className="btn btn-sm btn-light"
                onClick={handleCancelEdit}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="card-body">
              <label className="form-label small text-muted mb-1">New Title</label>
              <input
                type="text"
                className="form-control"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Enter new title"
                disabled={updatingTitle}
              />
              <div className="mt-3 d-flex justify-content-end gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={updatingTitle}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={() =>
                    handleSaveTitle(editContext.weekId, editContext.dayId, editContext.contentId)
                  }
                  disabled={updatingTitle || !editingTitle.trim()}
                >
                  {updatingTitle ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-1"></i>
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1060 }}
        >
          <div className="card shadow" style={{ width: "300px", borderRadius: "10px" }}>
            <div className="card-body py-3 px-4 text-center">
              <i className="bi bi-trash3 text-danger" style={{ fontSize: "1.8rem" }}></i>
              <p className="mt-2 mb-3" style={{ fontSize: "0.9rem" }}>Are you sure you want to delete this content?</p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={confirmDeleteContent}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default CourseContentManager;