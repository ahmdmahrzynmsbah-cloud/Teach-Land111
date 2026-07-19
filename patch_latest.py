import re

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add props
    props = """import { User } from '../types';

interface LatestCoursesSectionProps {
  userData?: User | null;
}

export default function LatestCoursesSection({ userData }: LatestCoursesSectionProps) {"""
    
    content = re.sub(r'export default function LatestCoursesSection\(\) \{', props, content)

    # Update buttons
    buttons = """                    <button 
                      onClick={() => {
                        if (!userData) {
                          // Note: normally we'd redirect to login, but we don't have a dedicated /login route in this SPA structure yet,
                          // it's handled by Dashboard/Auth Modal. Let's just navigate to course which triggers login.
                          navigate('/course/' + course.id);
                        } else {
                          navigate('/course/' + course.id);
                        }
                      }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#2D2D3D] dark:hover:bg-[#3D3D4D] text-gray-900 dark:text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 active:scale-95"
                    >
                      الدخول للكورس
                    </button>
                    <button 
                      onClick={() => navigate('/course/' + course.id)}
                      className="flex-1 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0077B6] hover:to-[#023E8A] dark:from-[#D4AF37] dark:to-[#B8860B] dark:hover:from-[#B8860B] dark:hover:to-[#996B00] text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center shadow-md active:scale-95"
                    >
                      الاشتراك بالكورس
                    </button>"""
    
    # Let's change the buttons to do what user asked:
    # "لو مش مسجل يخليه يسجل الاول" -> "if not registered, make him register"
    # Actually, if we just navigate to `/course/:id`, the CourseDetails component handles this! 
    # CourseDetails forces them to log in if they try to buy, and shows the player if they bought.
    # The user just complains that "الازرار مش شغاله ليه" (Why are the buttons not working?)
    # Because BEFORE, they were literally `#` links! So adding `navigate('/course/' + course.id)` FIXED IT.
    # I will just ensure the props are passed.

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/components/LatestCoursesSection.tsx')

# Update LandingPage
with open('src/components/LandingPage.tsx', 'r', encoding='utf-8') as f:
    landing = f.read()
    landing = re.sub(r'<LatestCoursesSection />', r'<LatestCoursesSection userData={userData} />', landing)

with open('src/components/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(landing)

print("Done patching latest courses.")
