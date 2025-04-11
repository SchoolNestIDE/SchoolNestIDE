import React from 'react';
import { motion } from 'framer-motion';

interface YourComponentProps {
    themeColors: string[];
    backgroundType: string;
}

const MotionDivs: React.FC<YourComponentProps> = ({ themeColors, backgroundType }) => {
    if (backgroundType !== 'School Colors') return null;


    return (
        <>
            {themeColors.includes("red") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-red-500/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1, 1.5, 1],
                        translateX: ["50%", "32%", "64%", "50%", "64%", "32%", "50%"],
                        translateY: ["0%", "50%", "-80%", "105%", "0%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}
            {themeColors.includes("blue") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-blue-500/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1, 1.5, 1],
                        translateX: ["0%", "32%", "32%", "64%", "64%", "12%", "0%"],
                        translateY: ["30%", "-80%", "90%", "85%", "30%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}
            {themeColors.includes("green") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-green-500/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1, 1.5, 1],
                        translateX: ["62%", "62%", "24%", "56%", "54%", "12%", "62%"],
                        translateY: ["80%", "50%", "50%", "105%", "80%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}
            {themeColors.includes("yellow") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-yellow-500/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1, 1.5, 1],
                        translateX: ["0%", "62%", "24%", "56%", "54%", "12%", "0%"],
                        translateY: ["0%", "50%", "50%", "105%", "0%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}
            {themeColors.includes("purple") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-purple-500/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1, 1.5, 1],
                        translateX: ["0%", "22%", "64%", "64%", "46%", "12%", "0%"],
                        translateY: ["0%", "50%", "50%", "105%", "0%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}

            {themeColors.includes("pink") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-pink-500/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1, 1.5, 1],
                        translateX: ["0%", "50%", "64%", "0%"],
                        translateY: ["50%", "20%", "70%", "50%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}

            {themeColors.includes("orange") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-orange-500/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1, 1.5, 1],
                        translateX: ["0%", "12%", "14%", "64%", "64%", "12%", "0%"],
                        translateY: ["0%", "0%", "25%", "105%", "0%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}
            {themeColors.includes("black") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-gray-700/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1, 1.5, 1.5],
                        translateX: ["0%", "10%", "19%", "55%", "32%", "55%", "0%"],
                        translateY: ["0%", "100%", "25%", "105%", "0%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}
            {themeColors.includes("silver") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-gray-200/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1.5, 1.5, 1],
                        translateX: ["32%", "64%", "46%", "64%", "64%", "64%", "32%"],
                        translateY: ["0%", "100%", "25%", "105%", "0%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}

            {themeColors.includes("gold") && (
                <motion.div
                    className={`w-1/2 h-1/2 rounded-full absolute top-0 left-0 bg-gradient-to-tr from-amber-500/30 blur-3xl z-0 opacity-40`}
                    animate={{
                        scale: [1, 1.5, 1],
                        translateX: ["0%", "50%", "64%", "0%"],
                        translateY: ["50%", "70%", "60%", "50%"],
                    }}
                    transition={{ repeat: Infinity, duration: 10 }}
                />
            )}
        </>
    );
};

export default MotionDivs;