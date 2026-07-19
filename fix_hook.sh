#!/bin/bash
sed -i '/const \[enrolling, setEnrolling\] = useState(false);/d' src/components/CourseDetails.tsx
sed -i '/const \[isSubmittingReview, setIsSubmittingReview\] = useState(false);/a \  const [enrolling, setEnrolling] = useState(false);' src/components/CourseDetails.tsx
