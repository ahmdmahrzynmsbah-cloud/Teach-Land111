#!/bin/bash
sed -i 's/const reviewsQ = query(collection(db, "reviews"), where("courseId", "==", id), orderBy("createdAt", "desc"));/const reviewsQ = query(collection(db, "reviews"), where("courseId", "==", id));/g' src/components/CourseDetails.tsx
sed -i '/setReviews(fetchedReviews);/i \          fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());' src/components/CourseDetails.tsx
